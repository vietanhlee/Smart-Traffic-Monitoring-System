import numpy as np
import cv2
import time

def convert_frame_to_byte(img: np.array) -> bytes:
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
        except Exception as e:
            print(f"Lỗi chuyển đổi sang bytes {e}")
            return None
    return None

def avg_none_zero(lst: list) -> int:
    non_zero = [x for x in lst if x != 0]
    return sum(non_zero) // len(non_zero) if non_zero else 0
    
def log(names : str, shared_data : dict) -> str:
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