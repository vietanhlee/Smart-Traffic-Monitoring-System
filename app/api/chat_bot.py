from api.dependencies import chat_bot
from fastapi import APIRouter
from schemas.ChatRequest import ChatRequest 
import asyncio

router = APIRouter()

@router.post(path='/chat')
async def chat(request: ChatRequest):
    data = await asyncio.to_thread(lambda : chat_bot.chat(user_input= request.message))
    # data = await asyncio.to_thread(chat_bot.chat, request.message)
    # await asyncio.to_thread(func(arg))	Gọi func(arg) NGAY lập tức, sai mục đích
    return {"response": data}