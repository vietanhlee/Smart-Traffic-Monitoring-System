from fastapi import APIRouter
from fastapi.responses import JSONResponse
from api import state
import asyncio
from services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
import config

router = APIRouter()

@router.on_event("startup")
def start_up():
    if state.analyzer is None:
        state.analyzer = AnalyzeOnRoadForMultiprocessing(show= False,
                                            show_log= False,
                                            is_join_processes= False,
                                            path_videos= config.PATH_VIDEOS,
                                            meter_per_pixels= config.METER_PER_PIXELS,
                                            regions= config.REGIONS)
        state.analyzer.run_multiprocessing()

@router.get(path= '/roads_name')
async def get_road_names():
    """
    API endpoint trả về danh sách tên các tuyến đường (road_name) mà analyzer đang xử lý.
    """
    # Lấy danh sách tên các tuyến đường từ shared_data của analyzer
    return JSONResponse(content={"road_names": state.analyzer.names})

# @router.get(path= '/veheicles')
# async def get_veheicles():
#     data = await asyncio.to_thread(state.analyzer.get_veheicles_info) # Truyền hàm
#     if data is None:
#         return JSONResponse(content={
#             "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
#             }, status_code=500)
#     return JSONResponse(content= data)

# @router.get(path= '/frames')
# async def get_frames():
#     data = await asyncio.to_thread(state.analyzer.get_frames)
#     if data is None:
#         return JSONResponse(content={
#             "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
#             }, status_code=500)
#     return JSONResponse(content= data)



from fastapi import WebSocket, WebSocketDisconnect

@router.websocket("/ws/frames/{road_name}")
async def websocket_frames(websocket: WebSocket, road_name: str):
    """
    WebSocket endpoint truyền liên tục frame (base64) của tuyến đường road_name.
    """
    await websocket.accept()
    try:
        while True:
            # Lấy frame hiện tại của tuyến đường
            data = await asyncio.to_thread(state.analyzer.get_frame_road, road_name)
            frame_base64 = data.get("frame", "")
            await websocket.send_json({"frame": frame_base64})
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        # Client đóng kết nối
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
            # Lấy info hiện tại của tuyến đường
            data = await asyncio.to_thread(state.analyzer.get_info_road, road_name)
            await websocket.send_json(data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        # Client đóng kết nối
        pass
    except Exception as e:
        await websocket.close()

@router.get(path= '/info/{road_name}')
async def get_info_road(road_name: str):
    data = await asyncio.to_thread(state.analyzer.get_info_road, road_name)
    if data is None:
        return JSONResponse(content={
            "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
            }, status_code=500)
    return JSONResponse(content= data)

@router.get(path= '/frames/{road_name}')
async def get_frame_road(road_name: str):
    data = await asyncio.to_thread(state.analyzer.get_frame_road, road_name)
    if data is None:
        return JSONResponse(content={
            "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
            }, status_code=500)
    return JSONResponse(content= data)