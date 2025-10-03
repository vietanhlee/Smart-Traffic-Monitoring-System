import os
from overrides import override
from services.road_services.AnalyzeOnRoadBase import AnalyzeOnRoadBase
from services.road_services import conf
# Đặt như này để tránh trường hợp lỗi do dùng chung thư viện AI 
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

class AnalyzeOnRoad(AnalyzeOnRoadBase):
    """Class này kế thừa từ class Base (xử lý tuần tự). Class con này chưa phải là code để multiprocessing\
    mà chỉ là một chút cải tiến từ code base (class Base) để có thể vừa xử lý video đầu vào ở một process\
    khác vừa có thể truy xuất thông tin về kết quả mà không bị hiện tượng tranh chấp dữ liệu    
    """    
    def __init__(self, path_video, meter_per_pixel, info_dict, frame_dict, region, model_path = conf.models_path, time_step=30,
                 is_draw=True, device= conf.device, iou=0.3, conf=0.2, show=True):
        """Class này kế thừa từ class Base (xử lý tuần tự). Class con này chưa phải là code để multiprocessing\
        mà chỉ là một chút cải tiến từ code base (class Base) để có thể vừa xử lý video đầu vào ở một process\
        khác vừa có thể truy xuất thông tin về kết quả mà không bị hiện tượng tranh chấp dữ liệu

        Args:
            path_video (str): Đường dẫn đến video
            meter_per_pixel (float): Tỉ lệ 1 mét ngoài đời với 1 pixel
            info_dict (Manager().dict()): Một dict dùng để chia sẽ giữ liệu trung gian giữa các process với nhau,\
            mặc định là sẽ được truyền tham chiếu và nó sẽ được thay đỏi nếu các process con thay đổi nó cho nên\
            ta có thể truy cập dữ liệu kết quả xử lý ở bên ngoài dễ dàng nhưng phải đảm bảo truy cập an toàn
            frame_dict (Manager().dict()): Tương tự info_dict nhưng dùng để chứa thông tin ảnh dạng bytecode đã được encode
            do manager() không hỗ trợ kiểu này nên ta sẽ dùng dict trung gian để chưa mã bytecode đó ở value (key là "frame")
            model_path (str): Đường dẫn đến model. Defaults to "best.pt".
            time_step (int): Khoảng thời gian giữa 2 lần cập nhật thông tin các phương tiện. Defaults to 30.
            is_draw (bool): Biến chỉ định có vẽ các thông tin xử lý được lên frame hay không. Defaults to True.
            device (str): Dùng GPU hoặc CPU. Defaults to 'cpu'.
            iou (float): Ngưỡng tin cậy về bounding box . Defaults to 0.3.
            conf (float): Ngưỡng tin cậy về nhãn được dự đoán. Defaults to 0.2.
            show (bool): Hiển thị video xử lý qua opencv, đặt là False khi tích làm server tránh lãng phí tài nguyên.\
            Defaults to True.
            
        Examples:`
        Hướng dẫn chạy xử lý 1 video đơn
        >>> analyzer = AnalyzeOnRoad(
        >>>     path_video=path_video,
        >>>     meter_per_pixel=meter_per_pixel,
        >>>     info_dict=info_dict,
        >>>     frame_dict=frame_dict,
        >>>     **kwargs
        >>> )
        >>> analyzer.process_on_single_video()
        """
        super().__init__(path_video, meter_per_pixel, model_path, time_step,
                 is_draw, device, iou, conf, show, region)
        self.info_dict = info_dict
        self.frame_dict = frame_dict

    @override
    def update_for_frame(self):
        """Cập nhật frame đang xử lý hiện tại gán vào Manage.dict() để chia sẽ dữ liệu các process với nhau dễ dàng. 
        """
        try: 
           self.frame_dict["frame"] = self.frame_output
        except Exception as e:
            print(f"Lỗi khi cập nhật frame mới nhất của {self.name}: {e}")

    @override
    def update_for_vehicle(self):
        """Hàm cập nhật thông tin về processing đang xử lý hiện tại và gán vào Manage.dict() để chia sẽ với nhau."""
        try:
            self.info_dict["count_car"] = self.count_car_display
            self.info_dict["count_motor"] = self.count_motor_display
            self.info_dict["speed_car"] = self.speed_car_display
            self.info_dict["speed_motor"] = self.speed_motor_display
        except Exception as e:
            print(f"Lỗi khi update thông tin phương tiện của {self.name}: {e}")

#************************************************************************ Script for testing *******************************************************
if __name__ == "__main__":
    from multiprocessing import Manager
    manager = Manager()
  
    path_video = "./video_test/Đường Láng.mp4"
    meter_per_pixel = 0.04
    info_dict = manager.dict({"count_car": 0,
                             "count_motor": 0,
                             "speed_car": 0,
                             "speed_motor": 0})
    frame_dict = manager.dict({"frame": None})
    
    analyzer = AnalyzeOnRoad(
        path_video=path_video,
        meter_per_pixel=meter_per_pixel,
        info_dict=info_dict,
        frame_dict=frame_dict,
        show=True
    )
    
    analyzer.process_on_single_video()
    