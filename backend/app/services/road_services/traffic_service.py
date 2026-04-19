from datetime import datetime, timezone

import cv2
import numpy as np
from aiortc import VideoStreamTrack
from av import VideoFrame
from fastapi.concurrency import run_in_threadpool

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.traffic_history import TrafficHistory


class RoadVideoStreamTrack(VideoStreamTrack):
    """WebRTC track chuyển dữ liệu JPEG từ analyzer thành VideoFrame.

    Lớp này được dùng khi client yêu cầu stream video qua WebRTC.
    Nó sẽ:
    - lấy ảnh JPEG từ analyzer theo tên tuyến đường,
    - giải mã ảnh về numpy array,
    - chuyển sang định dạng RGB,
    - tạo VideoFrame để gửi về phía client.
    Nếu không có frame thực tế, nó dùng ảnh fallback.
    """

    def __init__(self, analyzer, road_name: str):
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
        )

    async def recv(self) -> VideoFrame:
        """Trả về frame tiếp theo cho WebRTC.

        Hàm này chạy mỗi khi WebRTC cần một frame mới.
        """
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


class TrafficQueryService:
    """Dịch vụ truy vấn dữ liệu traffic và chuyển đổi dữ liệu cho biểu đồ."""

    @staticmethod
    def _to_chart_point(road_name: str, payload: dict) -> dict:
        """Chuyển payload traffic thành dữ liệu điểm biểu đồ chuẩn."""
        timestamp = payload.get("timestamp")
        try:
            normalized = str(timestamp).replace("Z", "+00:00") if timestamp else None
            dt = datetime.fromisoformat(normalized) if normalized else datetime.now(timezone.utc)
        except Exception:
            dt = datetime.now(timezone.utc)

        count_car = int(payload.get("count_car", 0) or 0)
        count_motor = int(payload.get("count_motor", 0) or 0)
        speed_car = float(payload.get("speed_car", 0) or 0)
        speed_motor = float(payload.get("speed_motor", 0) or 0)

        return {
            "road_name": road_name,
            "timestamp": dt,
            "time": dt.strftime("%H:%M:%S"),
            "count_car": count_car,
            "count_motor": count_motor,
            "speed_car": speed_car,
            "speed_motor": speed_motor,
            "total": count_car + count_motor,
        }

    @staticmethod
    async def get_latest_start_time(db: AsyncSession, road_name: str):
        """Lấy thời điểm ghi nhận mới nhất của tuyến đường từ cơ sở dữ liệu."""
        stmt = (
            select(TrafficHistory.recorded_at)
            .where(TrafficHistory.road_name == road_name)
            .order_by(desc(TrafficHistory.recorded_at))
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_history(db: AsyncSession, road_name: str, start_time: datetime, count: int):
        """Lấy lịch sử traffic cho tuyến đường, tối đa `count` bản ghi."""
        stmt = (
            select(TrafficHistory)
            .where(
                TrafficHistory.road_name == road_name,
                TrafficHistory.recorded_at <= start_time,
            )
            .order_by(desc(TrafficHistory.recorded_at))
            .limit(count)
        )
        result = await db.execute(stmt)
        rows = list(result.scalars().all())
        rows.reverse()
        return rows
