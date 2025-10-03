from api import state
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from schemas.ChatRequest import ChatRequest 
from schemas.ChatResponse import ChatResponse
import asyncio
from services.chat_services.ChatBotAgent import ChatBotAgent

router = APIRouter()

@router.on_event("startup")
def start_up():
    print("Starting up chat API...")
    if not hasattr(state, 'agent') or state.agent is None:
        print("Initializing Agent...")
        try:
            state.agent = ChatBotAgent()
            print("Agent initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Agent: {e}")
            state.agent = None


@router.post(path='/chat', response_model=ChatResponse)
async def chat(request: ChatRequest):
    data = await asyncio.to_thread(lambda : state.agent.chat(user_input= request.message))
    return ChatResponse(
        message=data["text"],
        image=data["image"]
    )

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint cho Agent (ChatBotAgent):
    - Client gửi JSON {"message": "..."}
    - Server trả JSON {"text": "...", "image": "..."}
    """
    await websocket.accept()
    try:

        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            if not user_message:
                await websocket.send_json({"text": "Bạn chưa nhập tin nhắn.", "image": None})
                continue


            response = await asyncio.to_thread(lambda: state.agent.get_response(user_message))
            await websocket.send_json({
                "text": response["text"], 
                "image": response["image"]
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "text": f"Lỗi: {str(e)}",
                "image": None
            })
        except:
            pass
        await websocket.close()