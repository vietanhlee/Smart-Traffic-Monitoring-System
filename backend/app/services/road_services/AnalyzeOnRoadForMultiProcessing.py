from multiprocessing import Process, freeze_support
import os
import json
import time
import subprocess
import redis
import psutil
from services.road_services.AnalyzeOnRoad import AnalyzeOnRoad
from core.config import settings_metric_transport, settings_server
from core.logging_config import get_logger

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
logger = get_logger(__name__)

""" Trên Windows, Python multiprocessing sử dụng spawn method thay vì fork (như trên Linux/macOS)
Khi spawn, Python phải import lại toàn bộ module để tạo process mới
Khi import module, tất cả code ở module level sẽ được thực thi lại"""

# Không bỏ ra ngoài Class vì mỗi khi tạo child process nó sẽ tạo thêm một lần nữa. Còn bỏ vào class nó chỉ khởi tạo 1 lần 
# Những class var cũng sẽ được khởi tạo cho nên tránh để những biến shared_data ở mức class
class AnalyzeOnRoadForMultiprocessing():
    def __init__(self, regions = settings_metric_transport.REGIONS, path_videos = settings_metric_transport.PATH_VIDEOS,
        meter_per_pixels = settings_metric_transport.METER_PER_PIXELS, show_log = False, show = False, is_join_processes = False):
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
        self.redis_client = redis.Redis.from_url(settings_server.REDIS_URL, decode_responses=False)
        self.show_log = show_log
        self.show = show
        self.is_join_processes = is_join_processes
        self.processes = {}
        self.log_process = None

        self.road_configs = {}
        for path_video, meter_per_pixel, region in zip(self.path_videos, self.meter_per_pixels, self.regions):
            road_name = os.path.splitext(os.path.basename(path_video))[0]
            self.road_configs[road_name] = {
                "path_video": path_video,
                "meter_per_pixel": meter_per_pixel,
                "region": region,
            }

        # `names` is used by roads_name API as currently-active roads.
        self.names = []

    def _seed_road_cache(self, road_name: str, status: str = "inactive"):
        self.redis_client.set(
            f"traffic:road:{road_name}:info",
            json.dumps(
                {
                    "count_car": 0,
                    "count_motor": 0,
                    "speed_car": 0,
                    "speed_motor": 0,
                    "status": status,
                },
                ensure_ascii=False,
            ),
        )
        self.redis_client.delete(f"traffic:road:{road_name}:frame")

    def _create_process_for_road(self, road_name: str) -> Process:
        cfg = self.road_configs[road_name]
        return Process(
            target=self.run_analyze_process,
            args=(
                cfg["region"],
                cfg["path_video"],
                cfg["meter_per_pixel"],
                settings_server.REDIS_URL,
                self.show,
            ),
            name=f"traffic-road-{road_name}",
        )

    @staticmethod
    def _kill_process_tree(pid: int):
        """Kill a process and all descendants to avoid lingering RAM-only workers."""
        try:
            parent = psutil.Process(pid)
        except psutil.NoSuchProcess:
            return

        children = parent.children(recursive=True)

        for child in children:
            try:
                child.terminate()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        _, alive_children = psutil.wait_procs(children, timeout=2)

        for child in alive_children:
            try:
                child.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        try:
            parent.terminate()
            parent.wait(timeout=2)
        except (psutil.TimeoutExpired, psutil.AccessDenied):
            try:
                parent.kill()
                parent.wait(timeout=2)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
                pass
        except psutil.NoSuchProcess:
            return

        # Extra fallback for Windows: force kill remaining descendants by OS command.
        try:
            still_alive = psutil.pid_exists(pid)
        except Exception:
            still_alive = False

        if still_alive and os.name == "nt":
            try:
                subprocess.run(
                    ["taskkill", "/PID", str(pid), "/T", "/F"],
                    check=False,
                    capture_output=True,
                    text=True,
                )
            except Exception:
                pass

    def _ensure_process_stopped(self, road_name: str, timeout: int = 5):
        process = self.processes.get(road_name)
        if process is None:
            return True

        pid = process.pid

        if process.is_alive():
            process.terminate()
            process.join(timeout=timeout)
            if process.is_alive():
                process.kill()
                process.join(timeout=timeout)

        # Even when Process object is not alive, descendants may remain.
        if pid:
            self._kill_process_tree(pid)

        if process.is_alive():
            logger.error("Failed to stop process cleanly: road=%s pid=%s", road_name, process.pid)
            return False

        if pid and psutil.pid_exists(pid):
            logger.error("PID still exists after stop: road=%s pid=%s", road_name, pid)
            return False

        try:
            process.close()
        except Exception:
            pass

        self.processes.pop(road_name, None)
        return True

    def start_road(self, road_name: str):
        if road_name not in self.road_configs:
            logger.warning("Attempt to start unknown road: %s", road_name)
            return {"ok": False, "detail": "Road not found."}

        process = self.processes.get(road_name)
        if process is not None and process.is_alive():
            logger.info("Road process already running: road=%s pid=%s", road_name, process.pid)
            return {"ok": True, "detail": "Road process already running."}

        self._seed_road_cache(road_name, status="active")
        process = self._create_process_for_road(road_name)
        process.start()
        self.processes[road_name] = process
        if road_name not in self.names:
            self.names.append(road_name)
        logger.info("Road process started: road=%s pid=%s", road_name, process.pid)
        return {
            "ok": True,
            "detail": "Road process started.",
            "road_name": road_name,
            "pid": process.pid,
        }

    def stop_road(self, road_name: str):
        if road_name not in self.road_configs:
            logger.warning("Attempt to stop unknown road: %s", road_name)
            return {"ok": False, "detail": "Road not found."}

        stopped = self._ensure_process_stopped(road_name)
        if not stopped:
            return {
                "ok": False,
                "detail": "Road process could not be stopped completely.",
                "road_name": road_name,
            }

        self._seed_road_cache(road_name, status="inactive")
        if road_name in self.names:
            self.names.remove(road_name)
        logger.info("Road process stopped: road=%s", road_name)
        return {
            "ok": True,
            "detail": "Road process stopped.",
            "road_name": road_name,
        }

    def get_roads_runtime_status(self):
        status_map = {}
        for road_name in self.road_configs.keys():
            process = self.processes.get(road_name)
            active = bool(process is not None and process.is_alive())
            status_map[road_name] = {
                "active": active,
                "pid": process.pid if active else None,
            }
        return status_map

    def cleanup_processes(self):
        """Dừng tất cả processes một cách an toàn"""
        logger.info("Cleaning up all traffic processes")
        for road_name in list(self.processes.keys()):
            self._ensure_process_stopped(road_name)
            self._seed_road_cache(road_name)

        self.names = []

        if self.log_process is not None and self.log_process.is_alive():
            self.log_process.terminate()
            self.log_process.join(timeout=2)
            if self.log_process.is_alive():
                self.log_process.kill()
        self.log_process = None

        logger.info("All traffic processes stopped")

    # hàm bình thường bỏ vào để tổ chức code Có thể gọi thông qua class hoặc instance, nhưng không thể truy cập 
    # trực tiếp vào thuộc tính của class hay instance, trừ khi được truyền vào.
    @staticmethod 
    def run_analyze_process(region, path_video, meter_per_pixel, redis_url, show):
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
            logger.info("Worker started for video=%s", path_video)
            analyzer = AnalyzeOnRoad(
                path_video=path_video,
                meter_per_pixel=meter_per_pixel,
                redis_url=redis_url,
                show= show, 
                region= region
            )
            analyzer.process_on_single_video()
        except Exception as e:
            logger.exception("Worker failed for video=%s error=%s", path_video, e)

    @staticmethod
    def run_log_process(names, redis_url):
        """In log dữ liệu giao thông bằng Redis để theo dõi nhanh runtime."""
        redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
        yellow = "\033[93m"
        green = "\033[92m"
        cyan = "\033[96m"
        reset = "\033[0m"
        bold = "\033[1m"

        try:
            while True:
                print(f"{bold}{cyan}--------------------------------------- [Log at {time.strftime('%H:%M:%S')}] --------------------------------------------{reset}")
                print(f"{bold}| {'Tuyến đường':<25} | {'Thông tin':<70} |{reset}")
                print(f"{'-'*102}")
                for name in names:
                    key = f"traffic:road:{name}:info"
                    raw_info = redis_client.get(key)
                    if not raw_info:
                        print(f"| {yellow}{name:<25}{reset} | {green}{'Đang khởi tạo...':<70}{reset} |")
                        continue

                    info = json.loads(raw_info)
                    count_car = info.get('count_car', 0)
                    count_motor = info.get('count_motor', 0)
                    speed_car = info.get('speed_car', 0)
                    speed_motor = info.get('speed_motor', 0)
                    info_str = f"Ô tô: {count_car} xe, Vtb: {speed_car} km/h | Xe máy: {count_motor} xe, Vtb: {speed_motor} km/h"
                    print(f"| {yellow}{name:<25}{reset} | {green}{info_str:<70}{reset} |")
                print(f"{'-'*102}\n\n")
                time.sleep(5)
        except KeyboardInterrupt:
            print("Kết thúc log.")

    def run_multiprocessing(self):
        """Hàm kích hoạt chạy multi processing"""
        freeze_support()

        for road_name in self.road_configs.keys():
            self.start_road(road_name)
        
        if self.show_log and (self.log_process is None or not self.log_process.is_alive()):
            self.log_process = Process(
                target=self.run_log_process,
                args=(self.names, settings_server.REDIS_URL),
                name="traffic-log-process",
            )
            self.log_process.start()

        if self.is_join_processes:
            self.join_process()
    
    def join_process(self):   
        """ Hàm để join các process với timeout""" 
        for road_name, p in list(self.processes.items()):
            if not p.is_alive():
                continue

            p.join(timeout=10)  # Timeout 10 giây
            if p.is_alive():
                logger.warning("Process did not stop in time, force kill road=%s pid=%s", road_name, p.pid)
                self._ensure_process_stopped(road_name, timeout=2)
        logger.info("join_process completed")
    
    def get_frame_road(self, road_name : str):
        data = b""
        if road_name not in self.names:
            return data
        frame_bytes = self.redis_client.get(f"traffic:road:{road_name}:frame")
        return frame_bytes or data
    
    def get_info_road(self, road_name : str):
        if road_name not in self.names:
            return {}
        raw = self.redis_client.get(f"traffic:road:{road_name}:info")
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except Exception:
            return {}

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
    #         vehicles_info = analyzer.get_vehicles_info()
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