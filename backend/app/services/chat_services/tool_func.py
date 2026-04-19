import json
import logging
from langchain.tools import tool, ToolRuntime
from typing import Annotated
from api.v1 import state
from utils.transport_utils import enrich_info_with_thresholds
from utils.minio_image_store import minio_image_store
from utils.chatbot_utils import append_private_image

logger = logging.getLogger(__name__)
@tool
def get_roads() -> str:
    """Lấy danh sách tên các tuyến đường đang được analyzer quản lý.

    Returns:
        str: Chuỗi JSON chứa một trong các dạng:
            - {"error": "..."} khi analyzer chưa sẵn sàng.
            - {"roads": [], "message": "..."} khi chưa có tuyến đường.
            - {"roads": ["..."]} khi có dữ liệu tuyến đường.
    """
    if state.analyzer is None:
        return json.dumps({"error": "Analyzer chưa được khởi tạo"}, ensure_ascii=False)
    
    road_names = state.analyzer.names
    if not road_names:
        return json.dumps({"roads": [], "message": "Không có tuyến đường nào."}, ensure_ascii=False)
    
    return json.dumps({"roads": road_names}, ensure_ascii=False)
    
@tool
def get_frame_road(
    road_name: Annotated[str, "Tên tuyến đường"],
    runtime: ToolRuntime,
) -> str:
    """Lấy frame hiện tại của một tuyến đường, upload lên MinIO và lưu URL vào private state.

    Args:
        road_name (Annotated[str, "Tên tuyến đường"]): Tên tuyến đường cần lấy ảnh.
        runtime (ToolRuntime): Runtime của tool để đọc `thread_id` từ config.

    Returns:
        str: Thông báo kết quả xử lý (thành công hoặc lỗi).
    """
    try:
        if state.analyzer is None:
            return "Analyzer chưa được khởi tạo, không thể lấy ảnh."

        frame_bytes = state.analyzer.get_frame_road(road_name)
        if not frame_bytes:
            return f"Không có frame hiện tại cho tuyến đường '{road_name}'."

        configurable = runtime.config.get("configurable", {})
        thread_id = str(configurable.get("thread_id", "anonymous"))
        image_url = minio_image_store.upload_road_frame(road_name=road_name, frame_bytes=frame_bytes)
        append_private_image(thread_id, image_url)
        return f"Đã lấy ảnh hiện tại cho tuyến đường '{road_name}' và đính kèm cho người dùng."
    except Exception as e:
        logger.exception("Lỗi khi xử lý ảnh tuyến đường '%s': %s", road_name, e)
        return f"Lỗi không xác định: {str(e)}"

@tool
def get_info_road(road_name: Annotated[str, "Tên tuyến đường"]) -> str:
    """Lấy thông tin giao thông của một tuyến đường dưới dạng JSON.

    Dữ liệu thô từ analyzer sẽ được enrich thêm theo ngưỡng cấu hình
    trước khi trả về cho agent.

    Args:
        road_name (Annotated[str, "Tên tuyến đường"]): Tên tuyến đường cần truy vấn.

    Returns:
        str: Chuỗi JSON chứa dữ liệu tuyến đường hoặc thông tin lỗi.
    """
    if state.analyzer is None:
        return json.dumps({"error": "Analyzer chưa được khởi tạo"}, ensure_ascii=False)
    
    data = state.analyzer.get_info_road(road_name)
    if not data:
        return json.dumps({"error": f"Không có dữ liệu cho tuyến đường '{road_name}'"}, ensure_ascii=False)
    data = enrich_info_with_thresholds(data, road_name)
    key = ['count_car', 'count_motor', 'speed_car', 'speed_motor', 'density_status', 'speed_status', ]
    data_return = {k: data.get(k, None) for k in key}
    return json.dumps(data_return, ensure_ascii=False)
    