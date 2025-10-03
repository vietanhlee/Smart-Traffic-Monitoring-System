from multiprocessing import Process, Manager, freeze_support
import os
from services.road_services.AnalyzeOnRoad import AnalyzeOnRoad
from services.utils import *
from services.road_services import conf
from services.utils import convert_frame_to_byte
import signal
import sys
import atexit

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
        meter_per_pixels = conf.meter_per_pixels, show_log = False, show = False, is_join_processes = False):
        """Khi tích hợp API vào thiết kế do cơ chế envent loop vòng lặp bất tận nên không cần join
        các process lại để tránh bị kill. Do đó phải đặt is_join_processes = False nếu không nó sẽ chặn
        envent loop của api khiến server nghẽn
        
        Join giúp giữ các sub thực hiện xong việc của nó và sẽ không bị kill khi main kết thúc
        tức là những câu lệnh sau join sẽ không thực hiện được nếu các process con chưa kết thúc.
        Vậy nên khi chạy như một script bình thường thì nên join, còn khi tích hợp api thì không nên join
        để tránh nghẽn event loop của api.
        
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
        
        # Đăng ký signal handler để xử lý Ctrl+C
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Đăng ký cleanup khi exit
        atexit.register(self.cleanup_processes)

    def _signal_handler(self, signum, frame):
        """Xử lý signal Ctrl+C và SIGTERM"""
        print(f"\nNhận signal {signum}, đang dừng các process...")
        self.cleanup_processes()
        sys.exit(0)

    def cleanup_processes(self):
        """Dừng tất cả processes một cách an toàn"""
        if hasattr(self, 'processes'):
            for p in self.processes:
                if p.is_alive():
                    print(f"Đang terminate process {p.pid}...")
                    p.terminate()
                    p.join(timeout=5)  # Chờ tối đa 5 giây
                    if p.is_alive():
                        print(f"Force kill process {p.pid}...")
                        p.kill()
            print("Tất cả processes đã được dừng.")

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
            frame_dict (Manager().dict()): Tương tự info_dict nhưng dùng để chứa thông tin ảnh byte code đã được encode
            do dữ liệu dạng bytecode mà manager không có kiểu này nên ta nó vào một dict trung gian
            show (bool): Hiển thị video hay không
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
        """ Hàm để join các process với timeout""" 
        for p in self.processes:
            if p.is_alive():
                p.join(timeout=10)  # Timeout 10 giây
                if p.is_alive():
                    print(f"Process {p.pid} không thể dừng, đang force kill...")
                    p.terminate()
                    p.join(timeout=2)
                    if p.is_alive():
                        p.kill()
        print("All processes stopped.")
    
    def get_frame_road(self, road_name : str):
        data = b""
        if road_name not in self.names:
            return data
        data = convert_frame_to_byte(self.shared_data[road_name]['frame'].get('frame', b""))
        return data
    
    def get_info_road(self, road_name : str):
        if road_name not in self.names:
            return {}
        return dict(self.shared_data[road_name]['info'])

#***********************************************************Script for testing************************************************************************
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