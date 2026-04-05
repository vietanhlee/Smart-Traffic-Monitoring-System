import asyncio
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from api import v1
from api.v1.traffic.dependencies import get_db_session, get_traffic_runtime
from api.v1.traffic.schemas import (
    ChartPointResponse,
    RoadsResponse,
    TrafficHistoryPoint,
    TrafficHistoryResponse,
    TrafficInfoResponse,
)
from api.v1.traffic.service import TrafficQueryService
from services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from services.road_services.traffic_history_worker import TrafficHistoryWorker
from utils.jwt_handler import get_current_user, get_current_user_ws
from utils.transport_utils import enrich_info_with_thresholds
from core.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.on_event("startup")
async def startup_traffic_runtime() -> None:
    try:
        if v1.state.analyzer is None:
            v1.state.analyzer = AnalyzeOnRoadForMultiprocessing()
            v1.state.analyzer.run_multiprocessing()

        if v1.state.traffic_history_worker is None:
            v1.state.traffic_history_worker = TrafficHistoryWorker()
            await v1.state.traffic_history_worker.start()
        logger.info("Traffic runtime started successfully")
    except Exception as exc:
        if v1.state.analyzer is not None:
            try:
                v1.state.analyzer.cleanup_processes()
            except Exception:
                pass
        logger.exception("Traffic startup degraded (Redis unavailable): %s", exc)
        v1.state.analyzer = None
        v1.state.traffic_history_worker = None


@router.get("/roads_name", response_model=RoadsResponse)
async def get_road_names(analyzer=Depends(get_traffic_runtime)):
    return {"road_names": analyzer.names}


@router.get("/history/{road_name}", response_model=TrafficHistoryResponse)
async def get_road_history(
    road_name: str,
    start_time: str | None = Query(default=None),
    count: int = Query(default=60, ge=1, le=1000),
    db: AsyncSession = Depends(get_db_session),
):
    normalized_start: datetime | None = None
    if start_time:
        try:
            normalized_start = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_time. Use ISO-8601 format.",
            ) from exc

    if normalized_start is None:
        normalized_start = await TrafficQueryService.get_latest_start_time(db, road_name)

    if normalized_start is None:
        return TrafficHistoryResponse(road_name=road_name, start_time=None, count=count, data=[])

    rows = await TrafficQueryService.get_history(db, road_name, normalized_start, count)
    data = [
        TrafficHistoryPoint(
            road_name=row.road_name,
            timestamp=row.recorded_at,
            time=row.recorded_at.strftime("%H:%M:%S") if row.recorded_at else "",
            count_car=row.avg_count_car,
            count_motor=row.avg_count_motor,
            speed_car=row.avg_speed_car,
            speed_motor=row.avg_speed_motor,
            total=int(row.avg_count_car or 0) + int(row.avg_count_motor or 0),
        )
        for row in rows
    ]

    return TrafficHistoryResponse(
        road_name=road_name,
        start_time=normalized_start,
        count=count,
        data=data,
    )


@router.websocket("/ws/frames/{road_name}")
async def websocket_frames(
    websocket: WebSocket,
    road_name: str,
    current_user=Depends(get_current_user_ws),
):
    analyzer = v1.state.analyzer
    if analyzer is None:
        await websocket.accept()
        await websocket.send_json({"detail": "Traffic service unavailable (Redis disconnected)."})
        await websocket.close(code=1013)
        return

    await websocket.accept()
    logger.info("frames websocket connected road=%s", road_name)
    try:
        while True:
            frame_bytes = await asyncio.to_thread(analyzer.get_frame_road, road_name)
            if frame_bytes:
                await websocket.send_bytes(frame_bytes)
            await asyncio.sleep(1 / 12)
    except WebSocketDisconnect:
        logger.info("frames websocket disconnected road=%s", road_name)
    except Exception as exc:
        logger.exception("frames websocket error road=%s error=%s", road_name, exc)
        await websocket.close()


@router.websocket("/ws/info/{road_name}")
async def websocket_info(
    websocket: WebSocket,
    road_name: str,
    current_user=Depends(get_current_user_ws),
):
    analyzer = v1.state.analyzer
    if analyzer is None:
        await websocket.accept()
        await websocket.send_json({"detail": "Traffic service unavailable (Redis disconnected)."})
        await websocket.close(code=1013)
        return

    await websocket.accept()
    logger.info("info websocket connected road=%s", road_name)
    try:
        while True:
            data = await asyncio.to_thread(analyzer.get_info_road, road_name)
            try:
                enriched = enrich_info_with_thresholds(data, road_name)
            except Exception:
                enriched = data
            await websocket.send_json(enriched)
            await asyncio.sleep(0.2)
    except WebSocketDisconnect:
        logger.info("info websocket disconnected road=%s", road_name)
    except Exception as exc:
        logger.exception("info websocket error road=%s error=%s", road_name, exc)
        await websocket.send_json({"detail": f"Internal error: {str(exc)}"})
        await websocket.close()


@router.websocket("/ws/chart/{road_name}")
async def websocket_chart(websocket: WebSocket, road_name: str):
    await websocket.accept()
    logger.info("chart websocket connected road=%s", road_name)

    analyzer = v1.state.analyzer
    if analyzer is None:
        await websocket.send_json({"detail": "Traffic service unavailable (Redis disconnected)."})
        await websocket.close(code=1013)
        return

    if road_name not in analyzer.names:
        await websocket.send_json({"detail": "Road not found"})
        await websocket.close(code=1008)
        return

    last_timestamp = ""
    try:
        while True:
            payload = await asyncio.to_thread(analyzer.get_info_road, road_name)
            if payload:
                current_ts = str(payload.get("timestamp", ""))
                if current_ts and current_ts != last_timestamp:
                    last_timestamp = current_ts
                    point = TrafficQueryService.to_chart_point(road_name, payload)
                    await websocket.send_json(ChartPointResponse(**point).model_dump(mode="json"))
            await asyncio.sleep(0.3)
    except WebSocketDisconnect:
        logger.info("chart websocket disconnected road=%s", road_name)
    except Exception as exc:
        logger.exception("chart websocket error road=%s error=%s", road_name, exc)
        await websocket.send_json({"detail": f"Internal error: {str(exc)}"})
        await websocket.close()


@router.get("/info/{road_name}", response_model=TrafficInfoResponse)
async def get_info_road(road_name: str, analyzer=Depends(get_traffic_runtime)):
    data = await asyncio.to_thread(analyzer.get_info_road, road_name)
    if data is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Traffic data unavailable")

    try:
        enriched = enrich_info_with_thresholds(data, road_name)
    except Exception:
        enriched = data
    return TrafficInfoResponse(**enriched)


@router.get("/frames/{road_name}")
async def get_frame_road(road_name: str, current_user=Depends(get_current_user), analyzer=Depends(get_traffic_runtime)):
    frame_bytes = await asyncio.to_thread(analyzer.get_frame_road, road_name)
    if frame_bytes is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Frame unavailable")
    return Response(content=frame_bytes, media_type="image/jpeg")


@router.get("/frames_no_auth/{road_name}")
async def get_frame_road_no_auth(road_name: str, analyzer=Depends(get_traffic_runtime)):
    frame_bytes = await asyncio.to_thread(analyzer.get_frame_road, road_name)
    if frame_bytes is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Frame unavailable")
    return Response(content=frame_bytes, media_type="image/jpeg")
