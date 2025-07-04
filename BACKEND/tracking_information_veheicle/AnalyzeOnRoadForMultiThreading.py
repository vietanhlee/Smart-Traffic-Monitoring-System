from tracking_information_veheicle.AnalyzeOnRoadForSingleThreading import AnalyzeOnRoadForSingleThreading
import threading
import time

class AnalyzeOnRoadForMultiThreading:
    def __init__(self, path_videos = [
                        # "./video test/Văn Quán.mp4",
                        "./video_test/Văn Phú.mp4",
                        "./video_test/Nguyễn Trãi.mp4",
                        "./video_test/Ngã Tư Sở.mp4",
                        "./video_test/Đường Láng.mp4",
                    ],
                 list_ratio_pixel_per_met = None, regions = None, show_log = True, show=False, device='cpu'):
        self.path_videos = path_videos
        self.list_ratio_pixel_per_met = list_ratio_pixel_per_met
        self.regions = regions
        self.show_log = show_log
        self.show = show
        self.device = device
        self.list_threads = []
        self.lock = threading.Lock()
        # self.results_all = {}
    
    def process(self):
        for video in self.path_videos:
            ob = AnalyzeOnRoadForSingleThreading(path_video= video, show= self.show, device= self.device)
            # ob_display = threading.Thread(target= ob.show_video, daemon= True)
            self.list_threads.append(ob)
            
            ob.start_thread()
            # ob_display.start()
        
                
        if self.show_log:
            thread_log = threading.Thread(target= self.log, daemon=True)
            thread_log.start()
            # self.update_results_for_all_threads()
        # self.join_threads()
    def join_threads(self):
        for ob in self.list_threads:
            ob.thread.join()  # Chờ từng thread xử lý video kết thúc

    def get_results_for_all_threads(self):
        results_all = {}
        for ob in self.list_threads:
            name = ob.path_video.split('/')[-1][:-4]
            info = ob.get_info_veheicles()
            results_all[name] = info 
        
        return results_all
    
    def get_frame_of_roads(self):
        results_all = {}
        for ob in self.list_threads:
            name = ob.path_video.split('/')[-1][:-4]
            info = ob.get_frame()
            results_all[name] = info
        
        return results_all
    def get_info_veheicles_on_roads(self):
        results_all = {}
        for ob in self.list_threads:
            name = ob.path_video.split('/')[-1][:-4]
            info = ob.get_info_veheicles()
            results_all[name] = info 
            
        return results_all
    
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
                for ob in self.list_threads:
                    name = ob.path_video.split('/')[-1][:-4]
                    info = ob.get_info()
                    if isinstance(info, dict):
                        info_str = f"Ô tô: {info.get('count_car')} xe, Vtb: {info.get('speed_car')} km/h | Xe máy: {info.get('count_motor')} xe, Vtb: {info.get('speed_motor')} km/s"
                    else:
                        info_str = str(info)
                    print(f"| {YELLOW}{name:<25}{RESET} | {GREEN}{info_str:<70}{RESET} |")
                print(f"{'-'*102}\n\n")
                time.sleep(5)
        except KeyboardInterrupt:
            print("Kết thúc.")  




# #***************************************************  Code for testing script  *********************************************************************#
                
if __name__ == '__main__':
    object = AnalyzeOnRoadForMultiThreading(show=True, show_log= True, device='cpu')
    object.process()
    
    # print(object.get_results_for_all_threads())

#     while True:
#         res = object.get_results_for_all_threads()
#         print(res)
#         time.sleep(2)














































# import threading
# import time

# class ConNguoi:
#     def __init__(self, ten: str):
#         self.ten = ten
#         self.quang_duong = 0
#         self.lock = threading.Lock()
#         self.thread = None

#     def chay(self):
#         while True:
#             with self.lock:
#                 self.quang_duong += 1
#             time.sleep(1)

#     def lay_quang_duong(self):
#         with self.lock:
#             return self.quang_duong

#     def start(self):
#         # Tạo thread chỉ 1 lần
#         if self.thread is None or not self.thread.is_alive():
#             self.thread = threading.Thread(target=self.chay, daemon=True)
#             self.thread.start()

# # ===== MAIN =====
# if __name__ == "__main__":
#     c1 = ConNguoi("A")
#     c2 = ConNguoi("B")

#     # Khởi động bằng cách gọi start()
#     c1.start()
#     c2.start()

#     try:
#         while True:
#             print(f"[{time.strftime('%H:%M:%S')}] A: {c1.lay_quang_duong()}m\tB: {c2.lay_quang_duong()}m")
#             time.sleep(2)
#     except KeyboardInterrupt:
#         print("Kết thúc.")

