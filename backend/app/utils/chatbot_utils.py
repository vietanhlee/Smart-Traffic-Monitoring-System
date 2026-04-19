from langchain_core.messages.utils import (
    trim_messages,
    count_tokens_approximately
)
from langchain.agents.middleware import AgentMiddleware
MAX_PRIVATE_IMAGES_PER_THREAD = 8
_chat_private_images: dict[str, list[str]] = {}

def _normalize_thread_id(thread_id: str | int | None) -> str:
    if thread_id is None:
        return "anonymous"
    return str(thread_id)


def clear_private_images(thread_id: str | int | None) -> None:
    key = _normalize_thread_id(thread_id)
    _chat_private_images.pop(key, None)

def append_private_image(thread_id: str | int | None, image_url: str) -> None:
    key = _normalize_thread_id(thread_id)
    images = _chat_private_images.setdefault(key, [])
    images.append(image_url)
    if len(images) > MAX_PRIVATE_IMAGES_PER_THREAD:
        del images[:-MAX_PRIVATE_IMAGES_PER_THREAD]


def pop_private_images(thread_id: str | int | None) -> list[str]:
    key = _normalize_thread_id(thread_id)
    return _chat_private_images.pop(key, [])

class TrimMessagesMiddleware(AgentMiddleware):
    """Middleware cắt lịch sử hội thoại trước mỗi lượt gọi model."""

    def __init__(self, max_tokens: int = 2000):
        self.max_tokens = max_tokens

    def before_model(self, state, runtime):
        messages = state.get("messages", [])
        trimmed_messages = trim_messages(
            messages,
            strategy="last",
            token_counter=count_tokens_approximately,
            max_tokens=self.max_tokens,
            start_on="human",
            end_on=("human", "tool"),
        )
        return {"llm_input_messages": trimmed_messages}
