from contextlib import AbstractContextManager
from datetime import datetime, timezone
from typing import Any, TypedDict
from uuid import uuid4
from services.chat_services.tool_func import get_frame_road, get_info_road, get_roads
from langchain.agents import AgentState, create_agent
from langchain.agents.middleware import ModelRequest, before_model, dynamic_prompt
from langchain.agents.structured_output import ToolStrategy
from langchain.messages import RemoveMessage
from fastapi.concurrency import run_in_threadpool
from core.config import setting_chatbot, settings_server
from core.logging_config import get_named_rotating_file_logger
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.redis import RedisSaver
from langgraph.store.postgres import PostgresStore
from langgraph.runtime import Runtime
from utils.chatbot_utils import clear_private_images, pop_private_images
from schemas.chat import AgentTextResponse
from google.genai.errors import ServerError
from .genai_errors import GenAIUnavailableError

_PROMPT = """Bạn là một trợ lý AI chuyên tư vấn giao thông bằng TIẾNG VIỆT.

MỤC TIÊU CHÍNH:
- Hiểu rõ ý định người dùng, trả lời ngắn gọn, chính xác và có cấu trúc.
- Khi người dùng yêu cầu thông tin về một hoặc nhiều tuyến đường, BẮT BUỘC phải cung cấp: số lượng và vận tốc trung bình của ô tô (ô tô) và xe máy (xe máy) cho từng tuyến và các thông tin về tình trạng giao thông của tuyến đường đó.

ĐỊNH DẠNG TRẢ LỜI (LUÔN BẰNG TIẾNG VIỆT):
1) Tóm tắt ngắn (1 câu)
2) Với mỗi tuyến đường được hỏi: tiêu đề tuyến ->
    - Số lượng ô tô: X
    - Vận tốc ô tô (trung bình): Y km/h
    - Số lượng xe máy: A
    - Vận tốc xe máy (trung bình): B km/h
    - Nhận xét tổng quát: (Ví dụ: Thông thoáng / Đông đúc / Tắc nghẽn)
3) Hành động khuyến nghị (2-3 gợi ý cụ thể, ví dụ chọn lộ trình, thời gian đi, cảnh báo)
4) Nếu người dùng yêu cầu ảnh: gọi `get_frame_road(road_name)` để hệ thống đính kèm ảnh qua API.
    KHÔNG in URL/base64 hay chuỗi dữ liệu ảnh vào phần `message`.

HƯỚNG DẪN HÀNH VI:
- Nếu người dùng không nói rõ tuyến đường, HỎI lại: "Bạn muốn thông tin tuyến đường nào?"
- Nếu có nhiều tuyến, trả lời theo mục rõ ràng cho từng tuyến.
- Tránh phán đoán không có dữ liệu; nếu thiếu dữ liệu, nói rõ: "Không có dữ liệu thời gian thực cho tuyến X" và gợi ý cách lấy (ví dụ: yêu cầu quyền, thử lại sau).
- Giữ giọng chuyên nghiệp, thân thiện và nhấn mạnh dữ liệu khi đưa khuyến nghị.

LƯU Ý KỸ THUẬT:
- Trả kết quả có thể parse được bởi chương trình (đặc biệt phần số liệu phải dễ trích xuất).
- Luôn trả bằng tiếng Việt.
"""

MAX_SHORT_TERM_MESSAGES = settings_server.CHAT_MAX_SHORT_TERM_MESSAGES
LONG_TERM_MEMORY_LIMIT = settings_server.CHAT_LONG_TERM_MEMORY_LIMIT
_ALLOWED_MSGPACK_MODULES = [("schemas.chat", "AgentTextResponse")]
_GEMINI_TOOL_CALL_ORDER_ERROR = "function call turn comes immediately after a user turn or after a function response turn"


class ChatAgentContext(TypedDict):
    user_id: str


def _message_type(message: Any) -> str:
    return str(getattr(message, "type", "") or "")


def _is_ai_tool_call_message(message: Any) -> bool:
    return _message_type(message) == "ai" and bool(getattr(message, "tool_calls", None))


def _sanitize_messages_for_gemini(messages: list[Any]) -> list[Any]:
    """Đảm bảo các lượt tool-call còn hợp lệ sau khi cắt ngắn lịch sử.

    Gemini yêu cầu AI function-call chỉ xuất hiện ngay sau human/tool turn.
    Hàm này loại bỏ các message mồ côi để tránh lỗi INVALID_ARGUMENT.
    """
    if not messages:
        return []
    
    window = list(messages[-MAX_SHORT_TERM_MESSAGES:])
    sanitized: list[Any] = []

    for msg in window:
        msg_type = _message_type(msg)

        if msg_type == "tool":
            if sanitized and _is_ai_tool_call_message(sanitized[-1]):
                sanitized.append(msg)
            continue

        if _is_ai_tool_call_message(msg):
            if not sanitized:
                continue
            prev_type = _message_type(sanitized[-1])
            if prev_type in {"human", "tool"}:
                sanitized.append(msg)
            continue

        sanitized.append(msg)

    while sanitized and _message_type(sanitized[0]) not in {"human", "system"}:
        sanitized.pop(0)

    while sanitized and _is_ai_tool_call_message(sanitized[-1]):
        sanitized.pop()

    return sanitized


@before_model
def _trim_messages_before_model(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """Cung cấp cửa sổ input đã xử lý cho LLM mà không thay đổi lịch sử chat đã lưu."""
    _ = runtime
    messages = state.get("messages", [])
    if not messages:
        return None

    keep = _sanitize_messages_for_gemini(messages)
    if not keep:
        return None

    # Keep default behavior when sanitization does not change anything and context is small.
    if len(messages) <= MAX_SHORT_TERM_MESSAGES and len(keep) == len(messages):
        return None

    return {"llm_input_messages": keep}


_agent_logger = get_named_rotating_file_logger(
    "chat_agent",
    "chat_agent.log",
    backup_count=3,
)


def _extract_user_id_from_context(context: Any) -> str | None:
    if isinstance(context, dict):
        user_id = context.get("user_id")
        return str(user_id) if user_id is not None else None
    user_id = getattr(context, "user_id", None)
    return str(user_id) if user_id is not None else None


def _extract_user_id_from_runtime(runtime: Any) -> str | None:
    """Resolve user id from runtime context first, then fallback to configurable.thread_id."""
    user_id = _extract_user_id_from_context(getattr(runtime, "context", None))
    if user_id:
        return user_id

    config = getattr(runtime, "config", None)
    if isinstance(config, dict):
        configurable = config.get("configurable", {})
        if isinstance(configurable, dict):
            thread_id = configurable.get("thread_id")
            return str(thread_id) if thread_id is not None else None

    return None


@dynamic_prompt
def _inject_long_term_memory_prompt(request: ModelRequest) -> str:
    """Inject relevant long-term memories into the system prompt using Postgres store."""
    base_prompt = _PROMPT
    runtime = request.runtime
    store = getattr(runtime, "store", None)
    if store is None:
        return base_prompt

    user_id = _extract_user_id_from_runtime(runtime)
    if not user_id:
        return base_prompt

    messages = request.state.get("messages", [])
    latest_user = ""
    for msg in reversed(messages):
        if getattr(msg, "type", "") == "human":
            latest_user = str(getattr(msg, "content", "") or "")
            break

    if not latest_user:
        return base_prompt

    namespace = ("memories", user_id)
    try:
        memories = store.search(namespace, query=latest_user, limit=LONG_TERM_MEMORY_LIMIT)
    except Exception as exc:
        _agent_logger.exception("Failed to fetch long-term memories for user_id=%s: %s", user_id, exc)
        return base_prompt

    if not memories:
        return base_prompt

    memory_lines: list[str] = []
    for item in memories:
        value = getattr(item, "value", {}) or {}
        text = value.get("data") if isinstance(value, dict) else None
        if text:
            memory_lines.append(f"- {text}")

    if not memory_lines:
        return base_prompt

    return (
        f"{base_prompt}\n\n"
        "BỘ NHỚ DÀI HẠN LIÊN QUAN ĐẾN NGƯỜI DÙNG (ưu tiên tham chiếu khi phù hợp):\n"
        f"{'\n'.join(memory_lines)}"
    )

class ChatBotAgent:
    def __init__(self):
        self._prompt = _PROMPT
        self._llm = setting_chatbot.LLM
        self._redis_cm: AbstractContextManager | None = None
        self._store_cm: AbstractContextManager | None = None
        self._checkpointer = self._build_checkpointer()
        self._store = self._build_store()
        self._agent = create_agent(
            model=self._llm,
            tools=[get_frame_road, get_info_road, get_roads],
            system_prompt=self._prompt,
            response_format=ToolStrategy(AgentTextResponse),
            middleware=[_trim_messages_before_model, _inject_long_term_memory_prompt],
            context_schema=ChatAgentContext,
            checkpointer=self._checkpointer,
            store=self._store,
        )

    def _build_checkpointer(self):
        """Ưu tiên Redis làm checkpoint bộ nhớ; nếu không có thì dùng InMemorySaver."""
        try:
            redis_url = settings_server.REDIS_URL
            self._redis_cm = RedisSaver.from_conn_string(redis_url)
            redis_checkpointer = self._redis_cm.__enter__()
            redis_checkpointer = redis_checkpointer.with_allowlist(_ALLOWED_MSGPACK_MODULES)
            redis_checkpointer.setup()
            _agent_logger.info("Initialized Redis checkpointer for chat memory: %s", redis_url)
            return redis_checkpointer
        except Exception as exc:
            _agent_logger.exception(
                "Redis checkpointer unavailable, fallback to InMemorySaver: %s",
                exc,
            )
            self._redis_cm = None
            return InMemorySaver().with_allowlist(_ALLOWED_MSGPACK_MODULES)

    def _build_store(self):
        """Khởi tạo PostgreSQL store cho bộ nhớ dài hạn; nếu không khởi tạo được thì trả về None."""
        try:
            db_uri = settings_server.CHAT_MEMORY_DB_URI
            db_uri = db_uri.replace("postgresql+asyncpg://", "postgresql://")
            self._store_cm = PostgresStore.from_conn_string(db_uri)
            store = self._store_cm.__enter__()
            store.setup()
            _agent_logger.info("Initialized Postgres long-term memory store: %s", db_uri)
            return store
        except Exception as exc:
            _agent_logger.exception("Postgres long-term memory unavailable: %s", exc)
            self._store_cm = None
            return None

    def _remember_user_fact(self, user_id: str, user_input: str) -> None:
        """Lưu các thông tin rõ ràng của người dùng vào bộ nhớ dài hạn."""
        if self._store is None:
            return

        lowered = user_input.lower()
        trigger_words = ("ghi nhớ", "nhớ rằng", "remember", "tôi tên", "tên tôi là")
        if not any(word in lowered for word in trigger_words):
            return

        namespace = ("memories", user_id)
        payload = {
            "data": user_input,
            "source": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            self._store.put(namespace, str(uuid4()), payload)
            _agent_logger.info("Stored long-term memory for user_id=%s", user_id)
        except Exception as exc:
            _agent_logger.exception("Failed to store long-term memory for user_id=%s: %s", user_id, exc)

    
    async def get_response(self, user_input: str, id: int) -> dict:
        """Lấy phản hồi từ Agent dựa trên đầu vào của người dùng.

        Args:
            user_input (str): Nội dung tin nhắn của người dùng.

        Returns:
            dict: Phản hồi từ Agent, bao gồm hình ảnh và văn bản.
        """
        
        
        thread_id = f"{id}"
        clear_private_images(thread_id)
        config = {"configurable": {"thread_id": thread_id}}
        payload = {"messages": [{"role": "user", "content": user_input}]}

        try:
            response = await run_in_threadpool(
                self._agent.invoke,
                payload,
                config,
            )
        except ServerError as exc:
            # Google GenAI 503 error handling
            if hasattr(exc, 'status_code') and exc.status_code == 503:
                _agent_logger.warning("Google GenAI model is overloaded (503). Returning friendly error message.")
                raise GenAIUnavailableError("AI hiện đang quá tải, vui lòng thử lại sau ít phút.")
            raise
        except Exception as exc:
            msg = str(exc).lower()
            if _GEMINI_TOOL_CALL_ORDER_ERROR in msg:
                _agent_logger.warning(
                    "Detected invalid Gemini tool-call order for thread_id=%s. Resetting thread history and retrying once.",
                    thread_id,
                )
                response = await run_in_threadpool(
                    self._agent.invoke,
                    {
                        "messages": [
                            RemoveMessage(id=REMOVE_ALL_MESSAGES),
                            {"role": "user", "content": user_input},
                        ]
                    },
                    config,
                )
            else:
                raise
        structured = response.get("structured_response")
        message = ""
        if structured is not None:
            message = getattr(structured, "message", "") or ""

        if not message:
            messages = response.get("messages", [])
            if messages:
                last_msg = messages[-1]
                message = getattr(last_msg, "content", "") or ""

        images = pop_private_images(thread_id)
        self._remember_user_fact(str(id), user_input)
        _agent_logger.info("raw agent response: %s", response)
        return {
            "message": message,
            "image": images,
        }

    def close(self) -> None:
        """Đóng các context manager Redis và Postgres nếu đã được tạo."""
        if self._store_cm is not None:
            try:
                self._store_cm.__exit__(None, None, None)
                _agent_logger.info("Postgres long-term memory store closed")
            except Exception as exc:
                _agent_logger.exception("Failed to close Postgres long-term memory store: %s", exc)

        if self._redis_cm is None:
            return
        try:
            self._redis_cm.__exit__(None, None, None)
            _agent_logger.info("Redis checkpointer closed")
        except Exception as exc:
            _agent_logger.exception("Failed to close Redis checkpointer: %s", exc)


# ************ TESTING ************
if __name__ == "__main__":
    chat = ChatBotAgent()
    res = chat.get_response("cho tôi xin thông tin về Văn Phú và Văn Quán, cả ảnh nữa nhé", id= 1)
    print(res['image'])
    print(res['message'])