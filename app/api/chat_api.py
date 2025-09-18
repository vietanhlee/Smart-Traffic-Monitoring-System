from api import state
from fastapi import APIRouter
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