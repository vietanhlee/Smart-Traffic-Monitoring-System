import cv2
import threading

from scipy.__config__ import show
from tracking_information_veheicle.AnalyzeOnRoad import AnalyzeOnRoad
from queue import Queue
import time
import base64

class AnalyzeOnRoadForSingleThreading(AnalyzeOnRoad):
    def __init__(self, path_video=None, model_path="best.pt",  
                 time_step=30, is_draw=True, device='cpu', 
                 iou=0.3, conf=0.2, meter_per_pixel=0.03, show=False):
        
        super().__init__(path_video, model_path, time_step, is_draw, device, iou, conf, meter_per_pixel, show)
        self.queue_frame = Queue()        
        self.lock_for_info_veheicles = threading.Lock()
        self.lock_for_get_frame = threading.Lock()
        self.thread = None    
        
        self.info_veheicles= {
            "count_car": 0,
            "count_motor": 0,
            "speed_car": 0,
            "speed_motor": 0,
        }
        
        self.frame_for_output_thread_base64 = None
    def process_on_single_video(self):
        cam = cv2.VideoCapture(self.path_video)
            
        while True:
            check, cap = cam.read()
            if not check:
                print('Khong doc duoc video')
            
            self.process_single_frame(cap)

            frame_display = cv2.resize(self.frame_output, (600, 400))
            
            self.queue_frame.put(frame_display)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
    def show_video(self):
        while True:
            if not self.queue_frame.empty():
                frame = self.queue_frame.get()
                cv2.imshow(self.path_video.split('/')[-1][:-4], frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    def update_for_frame(self):
        with self.lock_for_get_frame:
            # Encode frame sang JPEG
            _, jpeg = cv2.imencode('.jpg', self.frame_output)
            # chuyển sang base64
            self.frame_for_output_thread_base64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

    def update_for_vehicle(self):
        with self.lock_for_info_veheicles:
            self.info_veheicles["count_car"] = self.count_car_display
            self.info_veheicles["count_motor"] = self.count_motor_display
            self.info_veheicles["speed_car"] = self.speed_car_display
            self.info_veheicles["speed_motor"] = self.speed_motor_display
        
    def start_thread(self):
        self.thread = threading.Thread(target= self.process_on_single_video, daemon= True)
        self.thread.start()
        
        # Thread hiển thị video
        if self.show:
            # Tạo thread hiển thị video
            show_thread = threading.Thread(target=self.show_video, daemon=True)
            show_thread.start()
            
            # show_thread.join()  # Chờ thread hiển thị video kết thúc
        
        # self.thread.join()  # Chờ thread xử lý video kết thúc
        # self.show_video()            
        # self.log()
        
    def start_single_thread(self):
        '''for debug'''
        # Xử lý video trong thread
        self.thread = threading.Thread(target=self.process_on_single_video, daemon=True)
        self.thread.start()
  
        if self.show:
            # Thread hiển thị video
            show_thread = threading.Thread(target=self.show_video, daemon=True)
            show_thread.start()
        
        # while self.thread.is_alive():
        #     print(self.get_info()['count_car'])
        #     time.sleep(1)  # Chờ 1 giây trước khi lấy thông tin tiếp theo
        
        self.log()  # Bắt đầu ghi log
        self.thread.join()  # Chờ thread xử lý video kết thúc

    def get_info(self):
        with self.lock:
            return self.result
    def get_frame(self):
        res = {"frame": None}
        with self.lock_for_get_frame:
            res["frame"] = self.frame_for_output_thread_base64
            return res
    def get_info_veheicles(self):
        with self.lock_for_info_veheicles:
            return self.info_veheicles
    def log(self):
        # ANSI màu
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

                name = self.path_video.split('/')[-1][:-4]
                info = self.get_info()
                
                if isinstance(info, dict):
                    info_str = f"Ô tô: {info.get('count_car')} xe, Vtb: {info.get('speed_car')} km/h | Xe máy: {info.get('count_motor')} xe, Vtb: {info.get('speed_motor')} km/s"
                else:
                    info_str = str(info)
                print(f"| {YELLOW}{name:<25}{RESET} | {GREEN}{info_str:<70}{RESET} |")
            
                print(f"{'-'*102}\n\n")
                time.sleep(5)
        except KeyboardInterrupt:
            print("Kết thúc.")  
        


#***************************************************  Code for testing script  *********************************************************************#

if __name__ == '__main__':
    obj = AnalyzeOnRoadForSingleThreading(path_video= './video_test/Ngã Tư Sở.mp4', show= True)
    
    # Note: call start_single_thread()
    obj.start_single_thread()
    # print(obj.get_info())