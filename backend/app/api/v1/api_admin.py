import asyncio
from fastapi import APIRouter, Depends, HTTPException, WebSocketDisconnect, status, WebSocket
from fastapi.concurrency import run_in_threadpool
from api import v1
from utils.jwt_handler import get_current_user, get_current_user_ws
from models.user import User
from utils.system_metrics import get_system_metrics
from core.logging_config import get_logger


router = APIRouter(prefix="/admin")
logger = get_logger(__name__)


def _require_admin(user: User):
    if user.role_id != 0:
        logger.warning("Access denied for non-admin user_id=%s role_id=%s", user.id, user.role_id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới được phép truy cập tài nguyên hệ thống.",
        )


@router.get(
    path= "/resources",
    summary="Lấy thông tin tài nguyên hệ thống",
    description="API trả về metrics hệ thống (CPU, RAM, Disk, Network). Chỉ admin (role_id = 0) mới có quyền truy cập."
)
async def get_resources(current_user: User = Depends(get_current_user)):
    """Return basic system metrics. Admin only (role_id = 0)."""
    _require_admin(current_user)
    logger.info("Admin user_id=%s requested system resources", current_user.id)
    return get_system_metrics()


@router.get(
    path="/traffic/status",
    summary="Lấy trạng thái process traffic theo tuyến",
    description="Admin xem trạng thái subprocess traffic (đang chạy/dừng) của từng tuyến đường.",
)
async def get_traffic_process_status(current_user: User = Depends(get_current_user)):
    _require_admin(current_user)

    analyzer = v1.state.analyzer
    if analyzer is None:
        logger.error("Traffic status requested but analyzer is unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Traffic service is unavailable.",
        )

    statuses = await run_in_threadpool(analyzer.get_roads_runtime_status)
    logger.info("Admin user_id=%s fetched traffic process status", current_user.id)
    return {"roads": statuses}


@router.post(
    path="/traffic/roads/{road_name}/stop",
    summary="Dừng subprocess theo tuyến",
    description="Admin dừng hoàn toàn subprocess xử lý của một tuyến đường.",
)
async def stop_traffic_road_process(road_name: str, current_user: User = Depends(get_current_user)):
    _require_admin(current_user)

    analyzer = v1.state.analyzer
    if analyzer is None:
        logger.error("Stop road request for %s failed: analyzer unavailable", road_name)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Traffic service is unavailable.",
        )

    result = await run_in_threadpool(analyzer.stop_road, road_name)
    if not result.get("ok"):
        logger.warning("Stop road request failed for %s: %s", road_name, result.get("detail"))
        error_status = status.HTTP_404_NOT_FOUND if result.get("detail") == "Road not found." else status.HTTP_409_CONFLICT
        raise HTTPException(status_code=error_status, detail=result.get("detail", "Unable to stop road process."))
    logger.info("Admin user_id=%s stopped road process %s", current_user.id, road_name)
    return result


@router.post(
    path="/traffic/roads/{road_name}/start",
    summary="Khởi động subprocess theo tuyến",
    description="Admin khởi động lại subprocess xử lý của một tuyến đường đã dừng.",
)
async def start_traffic_road_process(road_name: str, current_user: User = Depends(get_current_user)):
    _require_admin(current_user)

    analyzer = v1.state.analyzer
    if analyzer is None:
        logger.error("Start road request for %s failed: analyzer unavailable", road_name)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Traffic service is unavailable.",
        )

    result = await run_in_threadpool(analyzer.start_road, road_name)
    if not result.get("ok"):
        logger.warning("Start road request failed for %s: %s", road_name, result.get("detail"))
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.get("detail", "Road not found."))
    logger.info("Admin user_id=%s started road process %s", current_user.id, road_name)
    return result

@router.websocket(
    path= "/ws/resources",
    name="WebSocket thông báo hệ thống cho admin"
)
async def websocket_resources(websocket: WebSocket, current_user: User = Depends(get_current_user_ws)):
    """
    WebSocket endpoint để gửi thông tin tài nguyên hệ thống theo thời gian thực cho admin.
    
    Args:
        current_user: User đã được xác thực (tự động inject bởi FastAPI)
        
    Authentication:
        Yêu cầu JWT token trong Authorization header (Bearer ...)
    """
    _require_admin(current_user)
    logger.info("Admin user_id=%s opened system metrics websocket", current_user.id)
        
    await websocket.accept()
    
    try:
        while True:
            metrics = get_system_metrics()
            await websocket.send_json(metrics)
            await asyncio.sleep(2) 
    except WebSocketDisconnect:
        logger.info("Admin user_id=%s closed system metrics websocket", current_user.id)