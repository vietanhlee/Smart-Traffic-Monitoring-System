from fastapi import APIRouter
from fastapi.responses import JSONResponse
from api.dependencies import analyzer
import asyncio
router = APIRouter()

@router.get(path= '/veheicles')
async def get_veheicles():
    data = await asyncio.to_thread(analyzer.get_veheicles_info) # Truyền hàm
    if data is None:
        return JSONResponse(content={
            "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
            }, status_code=500)
    return JSONResponse(content= data)

@router.get(path= '/frames')
async def get_frames():
    data = await asyncio.to_thread(analyzer.get_frames)
    if data is None:
        return JSONResponse(content={
            "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
            }, status_code=500)
    return JSONResponse(content= data)
    