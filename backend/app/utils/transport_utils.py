import logging
import numpy as np
import cv2
import time
from typing import Any, Dict, Optional, Sequence
from core.config import TRAFFIC_THRESHOLDS, DEFAULT_THRESHOLD, RoadThreshold


logger = logging.getLogger(__name__)

def convert_frame_to_byte(img: np.ndarray) -> Optional[bytes]:
    """ Hàm chuyển đổi ảnh dạng numpy sang bytes
    Args:
        img (np.array): dũ liệu ảnh được đọc bởi cv2

    Returns:
        bytes: mã bytes
    """
    if img is not None:
        try:
            _, jpeg = cv2.imencode('.jpg', img)
            return jpeg.tobytes()
        except Exception:
            logger.exception("Loi chuyen doi frame sang bytes")
            return None
    return None

def avg_none_zero(lst: list) -> int:
    non_zero = [x for x in lst if x != 0]
    return sum(non_zero) // len(non_zero) if non_zero else 0

def avg_none_zero_batch(
    car_counts: list,
    car_speeds: list,
    motor_counts: list,
    motor_speeds: list,
):
    """Tính trung bình bỏ qua 0 cho 4 list cùng lúc.
    Trả về tuple (count_car_avg, speed_car_avg, count_motor_avg, speed_motor_avg).
    Làm gọn code và giảm overhead gọi hàm lặp đi lặp lại.
    """
    # Sử dụng list comprehension nhanh, tránh tạo numpy array không cần thiết
    def _avg(lst):
        non_zero = [x for x in lst if x > 1]
        return (sum(non_zero) // len(non_zero)) if non_zero else 0

    return (
        _avg(car_counts),
        _avg(car_speeds),
        _avg(motor_counts),
        _avg(motor_speeds),
    )
    
def log(names: Sequence[str], shared_data: dict) -> str:
    """Hàm in ra log thông tin các processing
    Hàm này lấy data tổng thể ở share_data (Manager.dict() dùng để giao tiếp các process với nhau)
    Đặt hàm này là static method vì để tránh việc sử dụng multiprocessing bị lỗi do nó sẽ picke các biến\
    liên quan đến hàm để chuyển dữ liệu sang process con, đặc biệt là self chứa các tool của YOLO\
    và các biến khác không thể picke được.Dùng @staticmethod để tránh pickle cả class instance. Chỉ \
    truyền những tham số cần thiết, không truyền toàn bộ self"""
    
    YELLOW = "\033[93m"
    GREEN = "\033[92m"
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"
    
    try:
        while True:
            print(f"{BOLD}{CYAN}--------------------------------------- [Log at {time.strftime('%H:%M:%S')}] --------------------------------------------{RESET}")
            print(f"{BOLD}| {'Tuyến đường':<25} | {'Thông tin':<70} |{RESET}")
            print(f"{'-'*102}")
            
            for name in names:
                try:
                    if name in shared_data:
                        road_data = shared_data[name]
                        info_dict = road_data['info']
                    
                        count_car = info_dict.get('count_car', 0)
                        count_motor = info_dict.get('count_motor', 0)
                        speed_car = info_dict.get('speed_car', 0)
                        speed_motor = info_dict.get('speed_motor', 0)
                    
                        info_str = f"Ô tô: {count_car} xe, Vtb: {speed_car} km/h | Xe máy: {count_motor} xe, Vtb: {speed_motor} km/h"
                        print(f"| {YELLOW}{name:<25}{RESET} | {GREEN}{info_str:<70}{RESET} |")
                    else:
                        print(f"| {YELLOW}{name:<25}{RESET} | {GREEN}{'Đang khởi tạo...':<70}{RESET} |")
                except Exception as e:
                    print(f"| {YELLOW}{name:<25}{RESET} | {GREEN}{f'Lỗi: {str(e)}':<70}{RESET} |")
            
            print(f"{'-'*102}\n\n")
            time.sleep(5)
    except KeyboardInterrupt:
        print("Kết thúc log.")
        
    

def get_threshold_for_road(road_name: str) -> RoadThreshold:
    return TRAFFIC_THRESHOLDS.get(road_name, DEFAULT_THRESHOLD)

def enrich_info_with_thresholds(data: Dict[str, Any], road_name: str) -> Dict[str, Any]:
    """Attach density_status, speed_status and thresholds to a data dict when possible.

    This function is defensive: if expected numeric fields are missing or invalid,
    it will leave the original data intact and return it unchanged.
    """
    if not isinstance(data, dict):
        return data

    threshold = get_threshold_for_road(road_name)

    try:
        count_car = int(data.get("count_car", 0) or 0)
        count_motor = int(data.get("count_motor", 0) or 0)
        speed_car = float(data.get("speed_car", 0) or 0)
        speed_motor = float(data.get("speed_motor", 0) or 0)

        total = count_car + count_motor
        if total > threshold["c2"]:
            density_status = "Tắc nghẽn"
        elif total > threshold["c1"]:
            density_status = "Đông đúc"
        else:
            density_status = "Thông thoáng"

        avg_speed = (speed_car + speed_motor) / 2 if (speed_car or speed_motor) else 0
        speed_status = "Nhanh chóng" if avg_speed >= threshold["v"] else "Chậm chạp"

        # Attach computed fields
        data["density_status"] = density_status
        data["speed_status"] = speed_status
        data["thresholds"] = threshold

    except Exception:
        # If anything goes wrong, return original data without raising
        return data

    return data
