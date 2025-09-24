import requests
import json
from langchain_core.tools import tool

BASE_URL = "http://localhost:8000"

@tool
def get_frame_road(road_name : str) -> str:
    """Lấy url bytecode cho frame (ảnh) hiện tại của tuyến đường theo tên (road_name).
    Trả về url của ảnh JPEG.
    Args:
        road_name (str): Tên tuyến đường

    Returns:
        str: Url của ảnh JPEG
    """
    try:
        response = requests.get(f"{BASE_URL}/frames/{road_name}")
        if response.status_code == 200:
            return f"{BASE_URL}/frames/{road_name}"
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
def get_info_road(road_name: str) -> str:
    """Lấy thông tin (info) hiện tại của tuyến đường theo tên (road_name).
    Trả về chuỗi JSON chứa số lượng xe, tốc độ, v.v.
    Args:
        road_name (str): Tên tuyến đường

    Returns:
        str: Chuỗi JSON chứa số lượng xe, tốc độ, v.v.
    """
    try:
        response = requests.get(f"{BASE_URL}/info/{road_name}")
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
    
# bs64 = get_frame_road.invoke({"road_name": "Nguyễn Trãi"})

# import cv2
# import numpy as np
# import base64

# if bs64 and isinstance(bs64, str) and not bs64.startswith("Lỗi") and not bs64.startswith("Không"):
#     try:
#         img_bytes = base64.b64decode(bs64)
#         img_array = np.frombuffer(img_bytes, dtype=np.uint8)
#         img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
#         if img is not None:
#             cv2.imshow("Frame - Nguyễn Trãi", img)
#             cv2.waitKey(0)
#             cv2.destroyAllWindows()
#         else:
#             print("Không thể giải mã hình ảnh từ base64.")
#     except Exception as e:
#         print(f"Lỗi khi hiển thị hình ảnh: {e}")
# else:
#     print(bs64)
