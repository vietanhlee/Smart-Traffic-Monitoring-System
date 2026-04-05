import json
import base64
from langchain.tools import tool, ToolRuntime
from typing import Annotated
from api.v1 import state

@tool
def get_roads() -> str:
    """Lấy danh sách các tuyến đường hiện có từ hệ thống.
    Trả về chuỗi JSON chứa danh sách tên các tuyến đường.
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
    """Lấy frame hiện tại của tuyến đường và lưu base64 vào private state theo thread_id.
    Tool chỉ trả về mô tả ngắn để tránh đẩy base64 vào ngữ cảnh model.
    """
    try:
        if state.analyzer is None:
            return "Analyzer chưa được khởi tạo, không thể lấy ảnh."

        frame_bytes = state.analyzer.get_frame_road(road_name)
        if not frame_bytes:
            return f"Không có frame hiện tại cho tuyến đường '{road_name}'."

        configurable = runtime.config.get("configurable", {})
        thread_id = str(configurable.get("thread_id", "anonymous"))
        frame_b64 = base64.b64encode(frame_bytes).decode("ascii")
        state.append_private_image(thread_id, frame_b64)
        return f"Đã lấy ảnh hiện tại cho tuyến đường '{road_name}'."
    except Exception as e:
        return f"Lỗi không xác định: {str(e)}"

@tool
def get_info_road(road_name: Annotated[str, "Tên tuyến đường"]) -> str:
    """Lấy thông tin (info) hiện tại của tuyến đường theo tên (road_name).
    Trả về chuỗi JSON chứa số lượng xe, tốc độ, v.v.
    """
    if state.analyzer is None:
        return json.dumps({"error": "Analyzer chưa được khởi tạo"}, ensure_ascii=False)
    
    data = state.analyzer.get_info_road(road_name)
    if not data:
        return json.dumps({"error": f"Không có dữ liệu cho tuyến đường '{road_name}'"}, ensure_ascii=False)
    
    return json.dumps(data, ensure_ascii=False)
    