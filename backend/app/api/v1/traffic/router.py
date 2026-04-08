import asyncio
from datetime import datetime

import cv2
import numpy as np
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from api import v1
from api.v1.traffic.dependencies import get_db_session, get_traffic_runtime
from api.v1.traffic.schemas import (
    ChartPointResponse,
    RoadsResponse,
    TrafficHistoryPoint,
    TrafficHistoryResponse,
    TrafficInfoResponse,
    WebRTCSessionDescriptionRequest,
    WebRTCSessionDescriptionResponse,
)
from api.v1.traffic.service import TrafficQueryService
from services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from services.road_services.traffic_history_worker import TrafficHistoryWorker
from utils.jwt_handler import get_current_user, get_current_user_ws
from utils.transport_utils import enrich_info_with_thresholds
from core.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)
active_peer_connections: set[RTCPeerConnection] = set()


class RoadVideoStreamTrack(VideoStreamTrack):
    """WebRTC track that converts JPEG bytes from Redis into video frames."""

    def __init__(self, analyzer: AnalyzeOnRoadForMultiprocessing, road_name: str):
        super().__init__()
        self.analyzer = analyzer
        self.road_name = road_name
        self._fallback_frame = np.zeros((360, 640, 3), dtype=np.uint8)
        cv2.putText(
            self._fallback_frame,
            f"No frame: {road_name}",
            (20, 180),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

    async def recv(self) -> VideoFrame:
        pts, time_base = await self.next_timestamp()
        frame_rgb = self._fallback_frame

        frame_bytes = await run_in_threadpool(self.analyzer.get_frame_road, self.road_name)
        if frame_bytes:
            encoded = np.frombuffer(frame_bytes, dtype=np.uint8)
            decoded = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
            if decoded is not None:
                frame_rgb = cv2.cvtColor(decoded, cv2.COLOR_BGR2RGB)

        video_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame


async def _close_peer_connection(pc: RTCPeerConnection) -> None:
    active_peer_connections.discard(pc)
    if pc.connectionState != "closed":
        await pc.close()

@router.on_event("startup")
async def _startup_traffic_runtime() -> None:
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


@router.on_event("shutdown")
async def _shutdown_webrtc_connections() -> None:
    for pc in list(active_peer_connections):
        await _close_peer_connection(pc)


@router.post(
    "/webrtc/offer/{road_name}",
    response_model=WebRTCSessionDescriptionResponse,
)
async def webrtc_offer(
    road_name: str,
    payload: WebRTCSessionDescriptionRequest,
    current_user=Depends(get_current_user),
):
    _ = current_user
    analyzer = v1.state.analyzer
    if analyzer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Traffic service unavailable (Redis disconnected).",
        )

    if road_name not in analyzer.names:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Road not found or currently inactive.",
        )

    pc = RTCPeerConnection()
    active_peer_connections.add(pc)

    @pc.on("connectionstatechange")
    async def _on_connectionstatechange() -> None:
        logger.info("WebRTC state road=%s state=%s", road_name, pc.connectionState)
        if pc.connectionState in {"failed", "closed", "disconnected"}:
            await _close_peer_connection(pc)

    video_track = RoadVideoStreamTrack(analyzer=analyzer, road_name=road_name)
    pc.addTrack(video_track)

    try:
        offer = RTCSessionDescription(sdp=payload.sdp, type=payload.type)
        await pc.setRemoteDescription(offer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        local = pc.localDescription
        if local is None:
            raise RuntimeError("Unable to create local WebRTC description")

        return WebRTCSessionDescriptionResponse(sdp=local.sdp, type=local.type)
    except Exception:
        await _close_peer_connection(pc)
        raise


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
            frame_bytes = await run_in_threadpool(analyzer.get_frame_road, road_name)
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
            data = await run_in_threadpool(analyzer.get_info_road, road_name)
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
            payload = await run_in_threadpool(analyzer.get_info_road, road_name)
            if payload:
                current_ts = str(payload.get("timestamp", ""))
                if current_ts and current_ts != last_timestamp:
                    last_timestamp = current_ts
                    point = TrafficQueryService._to_chart_point(road_name, payload)
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
    data = await run_in_threadpool(analyzer.get_info_road, road_name)
    if data is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Traffic data unavailable")

    try:
        enriched = enrich_info_with_thresholds(data, road_name)
    except Exception:
        enriched = data
    return TrafficInfoResponse(**enriched)


@router.get("/frames/{road_name}")
async def get_frame_road(road_name: str, current_user=Depends(get_current_user), analyzer=Depends(get_traffic_runtime)):
    frame_bytes = await run_in_threadpool(analyzer.get_frame_road, road_name)
    if frame_bytes is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Frame unavailable")
    return Response(content=frame_bytes, media_type="image/jpeg")


@router.get("/frames_no_auth/{road_name}")
async def get_frame_road_no_auth(road_name: str, analyzer=Depends(get_traffic_runtime)):
    frame_bytes = await run_in_threadpool(analyzer.get_frame_road, road_name)
    if frame_bytes is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Frame unavailable")
    return Response(content=frame_bytes, media_type="image/jpeg")
