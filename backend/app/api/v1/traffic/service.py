from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.traffic_history import TrafficHistory


class TrafficQueryService:
    @staticmethod
    def _to_chart_point(road_name: str, payload: dict) -> dict:
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
