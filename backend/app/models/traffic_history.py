from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Index, Integer, String

from db.base import Base


class TrafficHistory(Base):
    """Lưu thống kê giao thông theo tuyến đường theo từng mốc thời gian."""

    __tablename__ = "traffic_histories"

    id = Column(Integer, primary_key=True, index=True)
    road_name = Column(String(128), nullable=False, index=True)
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)

    avg_count_car = Column(Integer, nullable=False, default=0)
    avg_count_motor = Column(Integer, nullable=False, default=0)
    avg_speed_car = Column(Float, nullable=False, default=0.0)
    avg_speed_motor = Column(Float, nullable=False, default=0.0)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    __table_args__ = (
        Index("ix_traffic_histories_road_name_recorded_at", "road_name", "recorded_at"),
    )
