from fastapi import APIRouter
from fastapi.responses import JSONResponse
from api import state
import asyncio
from services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from fastapi.responses import Response
from fastapi import WebSocket, WebSocketDisconnect

router = APIRouter()

@router.on_event("startup")
def start_up():
    if state.analyzer is None:
        state.analyzer = AnalyzeOnRoadForMultiprocessing()
        state.analyzer.run_multiprocessing()

@router.get(path= '/roads_name')
async def get_road_names():
    """
    API endpoint trả về danh sách tên các tuyến đường (road_name) mà analyzer đang xử lý.
    """
    return JSONResponse(content={"road_names": state.analyzer.names})

@router.websocket("/ws/frames/{road_name}")
async def websocket_frames(websocket: WebSocket, road_name: str):
    """
    WebSocket endpoint truyền liên tục frame (byte code) của tuyến đường road_name.
    """
    await websocket.accept()
    try:
        while True:
            frame_bytes = await asyncio.to_thread(state.analyzer.get_frame_road, road_name)
            await websocket.send_bytes(frame_bytes)
            await asyncio.sleep(1/30)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close()
        
@router.websocket("/ws/info/{road_name}")
async def websocket_info(websocket: WebSocket, road_name: str):
    """
    WebSocket endpoint truyền liên tục info (thông tin phương tiện) của tuyến đường road_name.
    """
    await websocket.accept()
    try:
        while True:
            data = await asyncio.to_thread(state.analyzer.get_info_road, road_name)
            await websocket.send_json(data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(data)
        await websocket.close()

@router.get(path= '/info/{road_name}')
async def get_info_road(road_name: str):
    data = await asyncio.to_thread(state.analyzer.get_info_road, road_name)
    if data is None:
        return JSONResponse(content={
            "Lỗi: Dữ liệu bị lỗi, kiểm tra road_services"
            }, status_code=500)
    return JSONResponse(content= data)


@router.get(path='/frames/{road_name}')
async def get_frame_road(road_name: str):
    frame_bytes = await asyncio.to_thread(state.analyzer.get_frame_road, road_name)

    if frame_bytes is None:
        return JSONResponse(
            content={"error": "Lỗi: Dữ liệu bị lỗi, kiểm tra core"},
            status_code=500
        )
    return Response(content=frame_bytes, media_type="image/jpeg")
