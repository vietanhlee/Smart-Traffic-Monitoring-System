from api import state
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from schemas.ChatRequest import ChatRequest 
import asyncio
from services.ChatBot import ChatBot

router = APIRouter()

@router.on_event("startup")
def start_up():
    if state.chat_bot is None:
        state.chat_bot = ChatBot()

@router.post(path='/chat')
async def chat(request: ChatRequest):
    data = await asyncio.to_thread(lambda : state.chat_bot.chat(user_input= request.message))
    # data = await asyncio.to_thread(chat_bot.chat, request.message)
    # await asyncio.to_thread(func(arg))	Gọi func(arg) NGAY lập tức, sai mục đích
    return {"response": data}


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint cho ChatBot:
    - Client gửi JSON {"message": "..."}
    - Server trả JSON {"response": "..."}
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            if not user_message:
                await websocket.send_json({"response": "Bạn chưa nhập tin nhắn."})
                continue

            # Gọi ChatBot trong thread pool để không block event loop
            response = await asyncio.to_thread(lambda: state.chat_bot.chat(user_input=user_message))
            await websocket.send_json({"response": response})

    except WebSocketDisconnect:
        # Client đóng kết nối
        pass
    except Exception as e:
        await websocket.close()