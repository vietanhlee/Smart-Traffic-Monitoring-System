from api.v1 import state
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from schemas.ChatRequest import ChatRequest 
from schemas.ChatResponse import ChatResponse
import asyncio
from services.chat_services.ChatBotAgent import ChatBotAgent
from utils.jwt_handler import get_current_user, decode_access_token
from fastapi import Depends, status


router = APIRouter()

@router.on_event("startup")
def start_up():
    print("Đã khởi tạo Agent")
    if not hasattr(state, 'agent') or state.agent is None:
        print("Đang khởi tạo Agent...")
        try:
            state.agent = ChatBotAgent()
            print("Khởi tạo Agent thành công")
        except Exception as e:
            print(f"Không thể khởi tạo Agent: {e}")
            state.agent = None


@router.post(path='/chat', response_model=ChatResponse)
async def chat(request: ChatRequest, current_user=Depends(get_current_user)):
    data = await asyncio.to_thread(lambda : state.agent.chat(user_input= request.message))
    return ChatResponse(
        message=data["message"],
        image=data["image"]
    )

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint cho Agent (ChatBotAgent):
    - Client gửi JSON {"message": "..."}
    - Server trả JSON {"message": "...", "image": "..."}
    """
    await websocket.accept()
    # Try get token from query 'token', header 'authorization', or cookie 'access_token'
    token = (
        websocket.query_params.get("token")
        or websocket.cookies.get("access_token")
        or websocket.headers.get("authorization")
    )
    if token and token.lower().startswith("bearer "):
        token = token.split(" ", 1)[1]
        
    if not token or decode_access_token(token) is None:
        await websocket.send_json({"detail": "Unauthorized — missing or invalid token"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    user = await get_current_user(token=token)
    
    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            if not user_message:
                await websocket.send_json({"message": "Bạn chưa nhập tin nhắn.", "image": None})
                continue


            response = await asyncio.to_thread(lambda: state.agent.get_response(user_message, id = user.id))
            await websocket.send_json({
                "message": response["message"], 
                "image": response["image"]
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "message": f"Lỗi: {str(e)}",
                "image": None
            })
        except:
            pass
        await websocket.close()