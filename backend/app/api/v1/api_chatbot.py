import logging
import sys
import traceback
from api.v1 import state
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from schemas.chat import ChatRequest
from schemas.chat import ChatResponse
from services.chat_services.chat_bot_agent import ChatBotAgent
from utils.jwt_handler import get_current_user, get_current_user_ws
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db.base import get_db, AsyncSessionLocal
from models.chat_message import ChatMessage
from fastapi.websockets import WebSocketState

router = APIRouter(prefix= "/chatbot")
logger = logging.getLogger(__name__)
BUSY_MESSAGE = "Hệ thống đang bận, vui lòng thử lại sau."


def _log_exception_everywhere(context: str, exc: Exception) -> None:
    """Log exception to configured logger (file) and stderr (console)."""
    logger.exception("%s: %s", context, exc)
    traceback.print_exception(type(exc), exc, exc.__traceback__, file=sys.stderr)


async def _safe_ws_send_busy(websocket: WebSocket) -> None:
    """Best-effort send busy message if websocket is still open."""
    if websocket.application_state != WebSocketState.CONNECTED:
        return
    try:
        await websocket.send_json({"message": BUSY_MESSAGE, "image": []})
    except Exception as exc:
        _log_exception_everywhere("Failed to send busy message via websocket", exc)


async def _safe_ws_close(websocket: WebSocket, code: int = 1011) -> None:
    """Best-effort close websocket and avoid duplicate close errors."""
    if websocket.application_state == WebSocketState.DISCONNECTED:
        return
    try:
        await websocket.close(code=code)
    except Exception as exc:
        _log_exception_everywhere("Failed to close websocket", exc)


async def _save_chat_turn(
    db: AsyncSession,
    user_id: int,
    user_message: str,
    ai_message: str,
    ai_images: list[str] | None,
    channel: str,
):
    """Save both user and assistant messages for one turn."""
    ai_extra_data = {"channel": channel}
    if ai_images:
        ai_extra_data["image_source"] = "minio-url"

    db.add(
        ChatMessage(
            user_id=user_id,
            message=user_message,
            is_user=True,
            images=None,
            extra_data={"channel": channel},
        )
    )
    db.add(
        ChatMessage(
            user_id=user_id,
            message=ai_message,
            is_user=False,
            images=ai_images or None,
            extra_data=ai_extra_data,
        )
    )
    await db.commit()

@router.on_event("startup")
def _startup_chat_agent():
    if not hasattr(state, 'agent') or state.agent is None:
        logger.info("Đang khởi tạo Chat Agent...")
        try:
            state.agent = ChatBotAgent()
            logger.info("Khởi tạo Chat Agent thành công")
        except Exception:
            logger.exception("Không thể khởi tạo Chat Agent")
            state.agent = None

@router.post(
    path='/chat',
    response_model=ChatResponse,
    summary="Chat với AI Assistant",
    description="API gửi tin nhắn tới AI Chatbot và nhận phản hồi. AI có thể trả lời về giao thông, cung cấp hình ảnh và thông tin liên quan. Yêu cầu JWT authentication."
)
async def chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if state.agent is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat service is unavailable.",
        )

    try:
        data = await state.agent.get_response(request.message, id=current_user.id)
        await _save_chat_turn(
            db=db,
            user_id=current_user.id,
            user_message=request.message,
            ai_message=data["message"],
            ai_images=data.get("image"),
            channel="http",
        )

        return ChatResponse(
            message=data["message"],
            image=data["image"]
        )
    except Exception as exc:
        _log_exception_everywhere("HTTP chat failed", exc)
        return ChatResponse(message=BUSY_MESSAGE, image=[])
    
@router.post(
    path='/chat_no_auth',
    response_model=ChatResponse,
    summary="Chat với AI (không xác thực)",
    description="API gửi tin nhắn tới AI Chatbot KHÔNG yêu cầu authentication. Dùng cho demo hoặc public access. Mặc định sử dụng user_id = 1."
)
async def chat_no_auth(request: ChatRequest):
    if state.agent is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat service is unavailable.",
        )

    try:
        data = await state.agent.get_response(request.message, id=9999)
        return ChatResponse(
            message=data["message"],
            image=data["image"]
        )
    except Exception as exc:
        _log_exception_everywhere("HTTP chat_no_auth failed", exc)
        return ChatResponse(message=BUSY_MESSAGE, image=[])
    
@router.websocket(
    path = "/ws/chat",
    name="WebSocket Chat"
)
async def websocket_chat(
    websocket: WebSocket,
    current_user=Depends(get_current_user_ws),
):
    """
    WebSocket endpoint cho AI ChatBot Agent.
    
    Args:
        current_user: User đã được xác thực (tự động inject bởi FastAPI)
    
    Flow:
    - Client gửi JSON: {"message": "..."}
    - Server trả JSON: {"message": "...", "image": "..."}
    
    Authentication:
        Yêu cầu token qua query params (?token=...), cookie (access_token), hoặc header (Authorization: Bearer ...)
    """
    if state.agent is None:
        await websocket.accept()
        await websocket.send_json({"message": BUSY_MESSAGE, "image": []})
        await websocket.close(code=1013)
        return

    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            if not user_message:
                await websocket.send_json({"message": "Bạn chưa nhập tin nhắn.", "image": None})
                continue

            try:
                response = await state.agent.get_response(user_message, id=current_user.id)
                async with AsyncSessionLocal() as db:
                    await _save_chat_turn(
                        db=db,
                        user_id=current_user.id,
                        user_message=user_message,
                        ai_message=response["message"],
                        ai_images=response.get("image"),
                        channel="websocket",
                    )

                await websocket.send_json({
                    "message": response["message"],
                    "image": response["image"]
                })
            except Exception as exc:
                _log_exception_everywhere("WebSocket chat turn failed", exc)
                await _safe_ws_send_busy(websocket)

    except WebSocketDisconnect:
        logger.info("WebSocket chat disconnected user_id=%s", getattr(current_user, "id", None))
    except Exception as exc:
        _log_exception_everywhere("WebSocket chat error", exc)
        await _safe_ws_send_busy(websocket)
        await _safe_ws_close(websocket)