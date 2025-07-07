import cv2
import time
import base64
from multiprocessing import Process, Manager
from AnalyzeOnRoad import AnalyzeOnRoad


class AnalyzeOnRoadForMultiprocessing(AnalyzeOnRoad):
    def __init__(self, path_video=None, model_path="best.pt",
                 time_step=30, is_draw=True, device='cpu',
                 iou=0.3, conf=0.2, meter_per_pixel=0.03, show=False):
        # super().__init__(path_video, model_path, time_step, is_draw, device, iou, conf, meter_per_pixel, show)

        self.manager = Manager()

        # DÙ TÊN GIỮ NGUYÊN -> nhưng trỏ vào shared dict
        self.info_veheicles = self.manager.dict({
            "count_car": 0,
            "count_motor": 0,
            "speed_car": 0,
            "speed_motor": 0,
        })

        # Giữ tên như cũ nhưng thực chất lưu trong shared dict luôn
        self.frame_for_output_thread_base64 = self.manager.Value(str, "")

        self.process = None
        self.log_process = None

    def update_for_frame(self):
        if self.frame_output is not None:
            _, jpeg = cv2.imencode('.jpg', self.frame_output)
            self.frame_for_output_thread_base64.value = base64.b64encode(jpeg.tobytes()).decode('utf-8')

    def update_for_vehicle(self):
        self.info_veheicles["count_car"] = self.count_car_display
        self.info_veheicles["count_motor"] = self.count_motor_display
        self.info_veheicles["speed_car"] = self.speed_car_display
        self.info_veheicles["speed_motor"] = self.speed_motor_display

    def process_on_single_video(self):

        cam = cv2.VideoCapture(self.path_video)

        while True:
            check, cap = cam.read()
            if not check:
                print(f'Không đọc được video: {self.path_video}')
                break

            self.process_single_frame(cap)

            if self.show:
                frame_display = cv2.resize(self.frame_output, (600, 400))
                cv2.imshow(self.path_video.split('/')[-1][:-4], frame_display)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        cam.release()
        if self.show:
            cv2.destroyAllWindows()

    def start_process(self):
        self.process = Process(target=self.process_on_single_video)
        self.process.daemon = True
        self.process.start()

    def start_log_process(self):
        self.log_process = Process(target=self.log)
        self.log_process.daemon = True
        self.log_process.start()

    def get_info_veheicles(self):
        return dict(self.info_veheicles)

    def get_frame(self):
        return {"frame": self.frame_for_output_thread_base64.value}

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
                info = self.get_info_veheicles()

                if isinstance(info, dict):
                    info_str = f"Ô tô: {info.get('count_car')} xe, Vtb: {info.get('speed_car')} km/h | Xe máy: {info.get('count_motor')} xe, Vtb: {info.get('speed_motor')} km/h"
                else:
                    info_str = str(info)

                print(f"| {YELLOW}{name:<25}{RESET} | {GREEN}{info_str:<70}{RESET} |")
                print(f"{'-'*102}\n\n")
                time.sleep(5)
        except KeyboardInterrupt:
            print("Kết thúc.")



if __name__ == "__main__":
    analyzer = AnalyzeOnRoadForMultiprocessing(path_video="./video_test/Ngã Tư Sơ.mp4", show=True)
    analyzer.start_process()
    analyzer.start_log_process()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Dừng toàn bộ.")
