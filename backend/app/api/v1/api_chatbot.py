import logging
import sys
import traceback
from api.v1 import state
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from schemas.chat import ChatRequest
from schemas.chat import ChatResponse
from services.chat_services.chat_bot_agent import ChatBotAgent
from services.chat_services.genai_errors import GenAIUnavailableError
from utils.chatbot_utils import save_user_message, save_ai_response
from utils.jwt_handler import get_current_user, get_current_user_ws
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db.base import get_db, AsyncSessionLocal

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
        # 1. Lưu tin nhắn user ngay khi nhận được
        await save_user_message(
            db=db,
            user_id=current_user.id,
            message=request.message,
            channel="http",
        )

        # 2. Gọi AI xử lý
        data = await state.agent.get_response(request.message, id=current_user.id)

        # 3. Lưu AI response sau khi có kết quả
        await save_ai_response(
            db=db,
            user_id=current_user.id,
            message=data["message"],
            images=data.get("image"),
            channel="http",
        )

        return ChatResponse(
            message=data["message"],
            image=data["image"]
        )
    except GenAIUnavailableError as exc:
        return ChatResponse(message=str(exc), image=[])
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
    except GenAIUnavailableError as exc:
        return ChatResponse(message=str(exc), image=[])
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
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                break
            except RuntimeError as exc:
                if websocket.application_state != WebSocketState.CONNECTED:
                    logger.info("WebSocket chat disconnected before receive user_id=%s", getattr(current_user, "id", None))
                    break
                raise

            user_message = data.get("message", "")
            if not user_message:
                await websocket.send_json({"message": "Bạn chưa nhập tin nhắn.", "image": None})
                continue

            try:
                # 1. Lưu tin nhắn user ngay khi nhận được
                async with AsyncSessionLocal() as db:
                    await save_user_message(
                        db=db,
                        user_id=current_user.id,
                        message=user_message,
                        channel="websocket",
                    )

                # 2. Gọi AI xử lý
                try:
                    response = await state.agent.get_response(user_message, id=current_user.id)
                except GenAIUnavailableError as exc:
                    await websocket.send_json({"message": str(exc), "image": []})
                    continue

                # 3. Lưu AI response sau khi có kết quả
                async with AsyncSessionLocal() as db:
                    await save_ai_response(
                        db=db,
                        user_id=current_user.id,
                        message=response["message"],
                        images=response.get("image"),
                        channel="websocket",
                    )

                await websocket.send_json({
                    "message": response["message"],
                    "image": response["image"]
                })
            except WebSocketDisconnect:
                logger.info("WebSocket chat disconnected during send user_id=%s", getattr(current_user, "id", None))
                break
            except RuntimeError as exc:
                if websocket.application_state != WebSocketState.CONNECTED:
                    logger.info("WebSocket chat disconnected during send user_id=%s", getattr(current_user, "id", None))
                    break
                _log_exception_everywhere("WebSocket chat turn failed", exc)
                await _safe_ws_send_busy(websocket)
            except Exception as exc:
                _log_exception_everywhere("WebSocket chat turn failed", exc)
                await _safe_ws_send_busy(websocket)

    except WebSocketDisconnect:
        logger.info("WebSocket chat disconnected user_id=%s", getattr(current_user, "id", None))
    except Exception as exc:
        _log_exception_everywhere("WebSocket chat error", exc)
        await _safe_ws_send_busy(websocket)
        await _safe_ws_close(websocket)