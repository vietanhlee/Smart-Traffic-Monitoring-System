from datetime import datetime
from pydantic import BaseModel, Field


class TrafficInfoResponse(BaseModel):
    count_car: int = Field(
        default=0,
        description="Số lượng ô tô được phát hiện.",
        example=12,
    )
    count_motor: int = Field(
        default=0,
        description="Số lượng xe máy được phát hiện.",
        example=28,
    )
    speed_car: float = Field(
        default=0.0,
        description="Tốc độ trung bình của ô tô (km/h).",
        example=42.5,
    )
    speed_motor: float = Field(
        default=0.0,
        description="Tốc độ trung bình của xe máy (km/h).",
        example=28.7,
    )
    timestamp: datetime | None = Field(
        default=None,
        description="Thời điểm chụp ảnh lưu lượng giao thông.",
        example="2026-04-19T12:34:56Z",
    )
    density_status: str | None = Field(
        default=None,
        description="Phân loại mật độ giao thông.",
        example="Đông đúc",
    )
    speed_status: str | None = Field(
        default=None,
        description="Phân loại tốc độ giao thông.",
        example="Chậm chạp",
    )
    thresholds: dict | None = Field(
        default=None,
        description="Ngưỡng dùng để đánh giá mật độ và tốc độ giao thông.",
        example={"c1": 20, "c2": 40, "v": 30},
    )


class TrafficHistoryPoint(BaseModel):
    road_name: str = Field(
        ...,
        description="Tên tuyến đường.",
        example="Văn Phú",
    )
    timestamp: datetime | None = Field(
        default=None,
        description="Thời điểm của điểm dữ liệu lịch sử.",
        example="2026-04-19T11:00:00Z",
    )
    time: str = Field(
        ...,
        description="Nhãn thời gian định dạng hiển thị.",
        example="11:00",
    )
    count_car: int = Field(
        ...,
        description="Số lượng ô tô trong khoảng thời gian đó.",
        example=8,
    )
    count_motor: int = Field(
        ...,
        description="Số lượng xe máy trong khoảng thời gian đó.",
        example=19,
    )
    speed_car: float = Field(
        ...,
        description="Tốc độ trung bình của ô tô trong khoảng thời gian đó.",
        example=40.2,
    )
    speed_motor: float = Field(
        ...,
        description="Tốc độ trung bình của xe máy trong khoảng thời gian đó.",
        example=29.4,
    )
    total: int = Field(
        ...,
        description="Tổng số phương tiện trong khoảng thời gian đó.",
        example=27,
    )


class TrafficHistoryResponse(BaseModel):
    road_name: str = Field(
        ...,
        description="Tên tuyến đường lịch sử.",
        example="Đường Láng",
    )
    start_time: datetime | None = Field(
        default=None,
        description="Thời điểm bắt đầu của khoảng lịch sử yêu cầu.",
        example="2026-04-19T10:00:00Z",
    )
    count: int = Field(
        ...,
        description="Số lượng bản ghi lịch sử trả về.",
        example=60,
    )
    data: list[TrafficHistoryPoint] = Field(
        ...,
        description="Danh sách dữ liệu lịch sử giao thông.",
    )


class RoadsResponse(BaseModel):
    road_names: list[str] = Field(
        ...,
        description="Danh sách tên các tuyến đường đang có sẵn.",
        example=["Văn Phú", "Nguyễn Trãi", "Ngã Tư Sở"],
    )


class ChartPointResponse(BaseModel):
    road_name: str = Field(
        ...,
        description="Tên tuyến đường cho điểm biểu đồ.",
        example="Văn Quán",
    )
    timestamp: datetime = Field(
        ...,
        description="Thời điểm điểm biểu đồ được tạo.",
        example="2026-04-19T12:35:00Z",
    )
    time: str = Field(
        ...,
        description="Nhãn thời gian hiển thị cho biểu đồ.",
        example="12:35",
    )
    count_car: int = Field(
        ...,
        description="Số lượng ô tô tại điểm biểu đồ.",
        example=10,
    )
    count_motor: int = Field(
        ...,
        description="Số lượng xe máy tại điểm biểu đồ.",
        example=18,
    )
    speed_car: float = Field(
        ...,
        description="Tốc độ trung bình của ô tô tại điểm biểu đồ.",
        example=41.0,
    )
    speed_motor: float = Field(
        ...,
        description="Tốc độ trung bình của xe máy tại điểm biểu đồ.",
        example=30.2,
    )
    total: int = Field(
        ...,
        description="Tổng số phương tiện tại điểm biểu đồ.",
        example=28,
    )


class WebRTCSessionDescriptionRequest(BaseModel):
    sdp: str = Field(
        ...,
        description="Nội dung SDP (session description protocol) gửi từ client.",
        example="v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\n...",
    )
    type: str = Field(
        ...,
        description="Loại SDP, ví dụ: offer hoặc answer.",
        example="offer",
    )


class WebRTCSessionDescriptionResponse(BaseModel):
    sdp: str = Field(
        ...,
        description="Nội dung SDP trả về cho client.",
        example="v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\n...",
    )
    type: str = Field(
        ...,
        description="Loại SDP trả về, ví dụ: answer.",
        example="answer",
    )