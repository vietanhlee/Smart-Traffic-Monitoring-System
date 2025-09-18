import base64
import numpy as np
import cv2
import time
def convert_frame_to_base64(img: np.array) -> str:
    """ Hàm chuyển đổi ảnh dạng numpy sang base64
    Args:
        img (np.array): dũ liệu ảnh được đọc bởi cv2

    Returns:
        str: mã base64
    """
    if img is not None:
        try:
            _, jpeg = cv2.imencode('.jpg', img)
            return base64.b64encode(jpeg.tobytes()).decode('utf-8')
        except Exception as e:
            print(f"Lỗi chuyển đổi sang base64 {e}")
            return None
    return None

def safe_avg_np(lst: list) -> int:
    """Hàm tính trung bình cộng các số dương

    Args:
        lst (list): list các số đầu vào (tốc độ tức thời các phương tiện)

    Returns:
        int: giá trị trung bình
    """
    arr = np.array(lst, dtype=np.int32)
    non_zero = arr[arr != 0]
    return int(non_zero.mean()) if non_zero.size > 0 else 0
    
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