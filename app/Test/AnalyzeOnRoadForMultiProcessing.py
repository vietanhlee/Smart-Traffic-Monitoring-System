from multiprocessing import Process, Manager, freeze_support
import os
from AnalyzeOnRoad import AnalyzeOnRoad
from utils import *
import conf
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

""" Trên Windows, Python multiprocessing sử dụng spawn method thay vì fork (như trên Linux/macOS)
Khi spawn, Python phải import lại toàn bộ module để tạo process mới
Khi import module, tất cả code ở module level sẽ được thực thi lại"""

# Không bỏ ra ngoài Class vì mỗi khi tạo child process nó sẽ tạo thêm một lần nữa. Còn bỏ vào class nó chỉ khởi tạo 1 lần 
# Những class var cũng sẽ được khởi tạo cho nên tránh để những biến shared_data ở mức class
class AnalyzeOnRoadForMultiprocessing():
    """
    Attributes:
        manager (Manager()): Đối tượng để tạo các Lock() và các kiểu dữ liệu chia sẽ chung khác
        của các process với nhau
        shared_data (Manager().dict()): dict quản lý các Lock và các kiểu dữ liệu chia sẽ chung khác
        của các process với nhau chặt chẽ hơn
        processes (list): các process con đang chạy 
    """
    def __init__(self, regions = conf.regions, path_videos = conf.path_videos,
        meter_per_pixels = conf.meter_per_pixels, show_log = False, show = False, is_join_processes = True):
        """Khi tích hợp API vào thiết kế do cơ chế envent loop vòng lặp bất tận nên không cần join
        các process lại để tránh bị kill. Do đó phải đặt is_join_processes = False nếu không nó sẽ chặn
        envent loop của api khiến server nghẽn

        Args:
            path_videos (list, optional): Đường dẫn các video. 
            Defaults to [ "./video_test/Văn Quán.mp4", "./video_test/Văn Phú.mp4", "./video_test/Nguyễn Trãi.mp4", "./video_test/Ngã Tư Sở.mp4", "./video_test/Đường Láng.mp4", ].
            meter_per_pixels (list, optional): list các tỉ số met/pixel. 
            Defaults to [0.03, 0.09, 0.4, 0.11, 0.06].
            show_log (bool, optional): hiển thị log hoặc không. Defaults to False.
            show (bool, optional): hiển thị video bằng cv2 hoặc không. Defaults to False.
            is_join_processes (bool, optional): join các process con lại (nên tắt đi khi tích hợp api). 
            Defaults to True.
        """
        self.path_videos = path_videos
        self.meter_per_pixels = meter_per_pixels
        self.regions = regions
        self.manager = Manager()
        self.shared_data = self.manager.dict()  # Dùng để lưu trữ thông tin chung giữa các process
        
        self.show_log = show_log
        self.show = show
        self.processes = []
        self.names = []
        self.is_join_processes = is_join_processes
    # hàm bình thường bỏ vào để tổ chức code Có thể gọi thông qua class hoặc instance, nhưng không thể truy cập 
    # trực tiếp vào thuộc tính của class hay instance, trừ khi được truyền vào.
    @staticmethod 
    def run_analyze_process(region, path_video, meter_per_pixel, info_dict, frame_dict, show):
        """Hàm chạy trong process riêng, làm hàm kích hoạt cho Multiprocessing. Đặt hàm này là static method vì
        để tránh việc sử dụng multiprocessing bị lỗi do nó sẽ picke các biến liên quan đến hàm để chuyển dữ liệu
        sang process con, đặc biệt là self chứa các tool của YOLO và các biến khác không thể picke được do đó 
        các đối tượng liên quan đến YOLO không picke được ta sẽ đưa nó vào hàm kích hoạt này luôn để khởi tạo
        và khi gọi kích hoạt nó thì nó sẽ đồng thời được khởi tạo ở process con luôn, đảm bảo tính toàn vẹn dữ liệu
        Tất nhiên sẽ có nhưunxg thuộc tính khác trong self ko picke được nên ta để static cho an toàn dữ liệu
        Dùng @staticmethod để tránh pickle cả class instance. Chỉ truyền những tham số cần thiết, 
        không truyền toàn bộ self
        Args:
            path_video (str): Đường dẫn đến video
            meter_per_pixel (float): Tỉ lệ 1 mét ngoài đời với 1 pixel
            info_dict (Manager().dict()): Một dict dùng để chia sẽ giữ liệu trung gian giữa các process với nhau,
            mặc định là sẽ được truyền tham chiếu và nó sẽ được thay đỏi nếu các process con thay đổi nó cho nên
            ta có thể truy cập dữ liệu kết quả xử lý ở bên ngoài dễ dàng nhưng phải đảm bảo truy cập an toàn
            frame_dict (Manager().dict()): Tương tự info_dict nhưng dùng để chứa thông tin mã hoá base64 của ảnh.
            Lý do tại sao dùng dict mà không dùng Manager().Value(str, "") là do tính bất biến của str dễ bị lỗi.
            Dùng dict thay thế thì cấu trúc nó sẽ như sau {"frame": <base64 string>}
        """
        try:
            analyzer = AnalyzeOnRoad(
                path_video=path_video,
                meter_per_pixel=meter_per_pixel,
                info_dict=info_dict,
                frame_dict=frame_dict,
                show= show, 
                region= region
            )
            analyzer.process_on_single_video()
        except Exception as e:
            print(f"Lỗi khi xử lý {path_video}: {e}")

    def run_multiprocessing(self):
        """Hàm kích hoạt chạy multi processing"""
        freeze_support()
        
        # Lặp qua để xử lý từng video với từng đường dẫn và tham số meter_per_pixel một 
        for path_video, meter_per_pixel, region in zip(self.path_videos, self.meter_per_pixels, self.regions):
            name = path_video.split('/')[-1][:-4]
            self.names.append(name)
            
            # Tạo các manager objects
            info_dict = self.manager.dict({
                "count_car": 0,
                "count_motor": 0,
                "speed_car": 0,
                "speed_motor": 0,
            })
            
            # Do việc chia sẽ các biến kiểu str
            # bị hạn chế trong multi processing nên ta lấy kiểu Manager.dict() chứa data str đó. Ví dụ như: 
            # dict = {'frame': <str base64>} phải cầm được khoá thì mới được lấy dữ liệu
            
            frame_dict = self.manager.dict({"frame": ""})

            # Lưu các khoá và các biến quản lý dữ liệu vào dict shared data để dễ quản lý. Việc láy data cũng 
            # đơn giản hơn do các thông tin như khoá và dữ liệu được phân bố vào dict để quản lý giúp chặt chẽ hơn
            self.shared_data[name] = {
                'info': info_dict,
                'frame': frame_dict,
            }
            
            # Tạo process với target là static method
            p = Process(
                target=self.run_analyze_process, 
                args=(
                    region, path_video, meter_per_pixel, info_dict, frame_dict, 
                    self.show
                ), 
                # kwargs={'show': True}
            )
            self.processes.append(p)
      
        # Start all self.processes
        for p in self.processes:
            p.start()
        
        if self.show_log:
            Process(target= log, args=(self.names, self.shared_data)).start()

        if self.is_join_processes:
            self.join_process()
    
    def join_process(self):   
        """ Hàm để join các process """ 
        for p in self.processes:
            p.join()
        print("All self.processes stopped.")
    
    def get_veheicles_info(self) -> dict:
        """Hàm để lấy thông tin về các phương tiện qua shared_data là Manager().dict() làm trung gian quản lý 
        và phải đặt ở main Process
        Returns:
            dict: Thông tin các phương tiện ở mỗi tuyến đường {tuyến đuòng : {thông tin}}
        """
        vehicles_info = {}
        for name, data in self.shared_data.items():
            vehicles_info[name] = dict(data['info'])
        return vehicles_info
    
    def get_frames(self) -> str:
        """Hàm để lấy frame từ các video qua shared_data là Manager().dict() làm trung gian quản lý
        và phải đặt ở main Process
        >>> frames[name] = {
                'frame': data['frame'].get('frame', ""), 
            }
        Bản thân cái data['frame'] là một dict {'frame': ảnh base64} do việc chia sẽ các biến kiểu str
        bị hạn chế trong multi processing nên ta lấy kiểu Manager.dict() chứa data str đó. Ví dụ như: dict = {'frame': <str base64>}
        phải cầm được khoá thì mới được lấy dữ liệu

        Returns:
            str: các ảnh được mã hoá base64 
        """
        frames = {}
        for name, data in self.shared_data.items():
            frames[name] = {
                'frame': data['frame'].get('frame', "")
            }
        return frames
    
    def get_frame_road(self, road_name : str):
        data = {}
        data['frame'] = self.shared_data[road_name]['frame'].get('frame', "")
        return data
    
    def get_info_road(self, road_name : str):
        data = {}
        data = dict(self.shared_data[road_name]['info'])
        return data
    
    
    
#********************************************************************Script for testing************************************************************************
if __name__ == '__main__':
    # freeze_support should be called immediately in the main block
    freeze_support()
    analyzer = AnalyzeOnRoadForMultiprocessing(
        show_log= True,
        show= True, 
        is_join_processes= True
    )
    analyzer.run_multiprocessing()
    
    # Phần main process
    # time.sleep(5)
    # while True:
    #     try:
    #         vehicles_info = analyzer.get_veheicles_info()
    #         frames = analyzer.get_frames()
            
    #         print("\nCurrent Vehicles Info:")
    #         for name, info in vehicles_info.items():
    #             print(f"{name}: {info}")
            
    #         # print("\nCurrent Frames:")
    #         for name, frame in frames.items():
    #             print(f"{name}: {frame['frame'][:10]}...")  # Print first 10 characters of the frame string
            
    #         time.sleep(0.01)
    #     except KeyboardInterrupt:
    #         print("Exiting...")
    #         break