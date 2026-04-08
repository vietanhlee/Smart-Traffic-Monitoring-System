from datetime import datetime

from pydantic import BaseModel, Field


class TrafficInfoResponse(BaseModel):
    count_car: int = Field(default=0)
    count_motor: int = Field(default=0)
    speed_car: float = Field(default=0.0)
    speed_motor: float = Field(default=0.0)
    timestamp: datetime | None = None
    density_status: str | None = None
    speed_status: str | None = None
    thresholds: dict | None = None


class TrafficHistoryPoint(BaseModel):
    road_name: str
    timestamp: datetime | None = None
    time: str
    count_car: int
    count_motor: int
    speed_car: float
    speed_motor: float
    total: int


class TrafficHistoryResponse(BaseModel):
    road_name: str
    start_time: datetime | None = None
    count: int
    data: list[TrafficHistoryPoint]


class RoadsResponse(BaseModel):
    road_names: list[str]


class ChartPointResponse(BaseModel):
    road_name: str
    timestamp: datetime
    time: str
    count_car: int
    count_motor: int
    speed_car: float
    speed_motor: float
    total: int


class WebRTCSessionDescriptionRequest(BaseModel):
    sdp: str
    type: str


class WebRTCSessionDescriptionResponse(BaseModel):
    sdp: str
    type: str
