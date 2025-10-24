import requests
import json
from langchain_core.tools import tool
from typing import Annotated

BASE_URL = "http://localhost:8000"

@tool
def get_roads(token: str = None) -> str:
    """Lấy danh sách các tuyến đường hiện có từ API.
    Trả về chuỗi JSON chứa danh sách tên các tuyến đường.
    """
    try:
        headers = {}
        url = f"{BASE_URL}/roads_name"
        if token:
            # Chèn token vào query string hoặc header
            url += f"?token={token}"
            headers["Authorization"] = f"Bearer {token}"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data and data != []:
                return json.dumps(data, ensure_ascii=False)
            else:
                return "Không có tuyến đường nào."
        elif response.status_code == 500:
            return "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
        else:
            return f"Lỗi API: {response.status_code} - {response.text}"
    except requests.exceptions.ConnectionError:
        return "Không thể kết nối đến API server. Kiểm tra xem server có đang chạy không."
    except requests.exceptions.RequestException as e:
        return f"Lỗi khi gọi API: {str(e)}"
    except Exception as e:
        return f"Lỗi không xác định: {str(e)}"
    
@tool
def get_frame_road(road_name: Annotated[str, "Tên tuyến đường"], token: str = None) -> str:
    """Lấy url bytecode cho frame (ảnh) hiện tại của tuyến đường theo tên (road_name).
    Trả về url của ảnh JPEG.
    """
    try:
        url = f"{BASE_URL}/frames/{road_name}"
        if token:
            url += f"?token={token}"
        return url
    except Exception as e:
        return f"Lỗi không xác định: {str(e)}"

@tool
def get_info_road(road_name: Annotated[str, "Tên tuyến đường"], token: str = None) -> str:
    """Lấy thông tin (info) hiện tại của tuyến đường theo tên (road_name).
    Trả về chuỗi JSON chứa số lượng xe, tốc độ, v.v.
    """
    try:
        headers = {}
        url = f"{BASE_URL}/info/{road_name}"
        if token:
            url += f"?token={token}"
            headers["Authorization"] = f"Bearer {token}"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data and data != {}:
                return json.dumps(data, ensure_ascii=False)
            else:
                return "Không lấy được info cho tuyến đường này."
        elif response.status_code == 500:
            return "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
        else:
            return f"Lỗi API: {response.status_code} - {response.text}"
    except requests.exceptions.ConnectionError:
        return "Không thể kết nối đến API server. Kiểm tra xem server có đang chạy không."
    except requests.exceptions.RequestException as e:
        return f"Lỗi khi gọi API: {str(e)}"
    except Exception as e:
        return f"Lỗi không xác định: {str(e)}"
    