from langchain_core import tools

def get_frame_road(road_name : str) -> str:
    """
    Lấy frame (ảnh) hiện tại của tuyến đường theo tên (road_name).
    Trả về chuỗi base64 của ảnh JPEG.
    """
    # Tránh import vòng lặp, import tại đây
    from api import state
    if state.analyzer is None:
        return "Hệ thống chưa sẵn sàng hoặc analyzer chưa khởi tạo."
    data = state.analyzer.get_frame_road(road_name)
    if data is None or "frame" not in data:
        return "Không lấy được frame cho tuyến đường này."
    return data["frame"]

def get_info_road(road_name: str) -> str:
    """
    Lấy thông tin (info) hiện tại của tuyến đường theo tên (road_name).
    Trả về chuỗi JSON chứa số lượng xe, tốc độ, v.v.
    """
    from api import state
    if state.analyzer is None:
        return "Hệ thống chưa sẵn sàng hoặc analyzer chưa khởi tạo."
    data = state.analyzer.get_info_road(road_name)
    if data is None:
        return "Không lấy được info cho tuyến đường này."
    return str(data)