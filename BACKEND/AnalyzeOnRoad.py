import cv2
import os
import numpy as np
import base64
from AnalyzeOnRoadBase import AnalyzeOnRoadBase

# Set environment variable to avoid KMP duplicate library error
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

class AnalyzeOnRoad(AnalyzeOnRoadBase):
    """Class này kế thừa từ class Base (xử lý đồng bộ nhau), Class con này sinh ra để phục vụ cho việc tạo multiprocessing sau này
    Atributes:
        lock_info: là một Manager.Lock() để phục vụ lấy và cập nhật dữ liệu
        
"""
    def __init__(self, path_video, meter_per_pixel, info_dict, frame_dict, 
                 lock_info, lock_frame, model_path="best.pt", time_step=30,
                 is_draw=True, device='cpu', iou=0.3, conf=0.2, show=True):
        super().__init__(path_video, meter_per_pixel, model_path, time_step,
                 is_draw, device, iou, conf, show)

        self.lock_info = lock_info
        self.lock_frame = lock_frame
        self.info_dict = info_dict
        self.frame_dict = frame_dict
        
    def convert_frame_to_base64(self, img: np.array) -> str:
        """Hàm chuyển đổi sang base64 để sau này trả cho Client qua api"""
        if img is not None:
            try:
                _, jpeg = cv2.imencode('.jpg', img)
                return base64.b64encode(jpeg.tobytes()).decode('utf-8')
            except Exception as e:
                print(f"Lỗi chuyển đổi sang base64 của {self.name}: {e}")
                return None
        return None

    def update_for_frame(self):
        """Hàm cập nhật frame đang xử lý hiện tại, chuyển qua base64 và gán vào Manage.dict() để chia sẽ với nhau
        do cơ chế Multiprocessing. 
        >>> with self.lock_frame:
        >>>     self.frame_dict["frame"] = self.convert_frame_to_base64(self.frame_output)
        Thực hiện việc lấy khoá Manager().Lock() để tránh data hazard"""
        try: 
            with self.lock_frame:
                self.frame_dict["frame"] = self.convert_frame_to_base64(self.frame_output)
        except Exception as e:
            print(f"Lỗi khi chuyển đổi frame sang base64 hoặc lỗi khoá lock của process của {self.name}: {e}")

    def update_for_vehicle(self):
        """Hàm cập nhật thông tin về processing đang xử lý hiện tại và gán vào Manage.dict() để chia sẽ với nhau
        do cơ chế Multiprocessing. 
        >>> with self.lock_info:
        >>>     self.info_dict["count_car"] = self.count_car_display
        >>>     self.info_dict["count_motor"] = self.count_motor_display
        >>>     self.info_dict["speed_car"] = self.speed_car_display
        >>>     self.info_dict["speed_motor"] = self.speed_motor_display
        Thực hiện việc lấy khoá Manager().Lock() để tránh data hazard"""
        try:
            with self.lock_info:
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
    lock_info = manager.Lock()
    lock_frame = manager.Lock()
    
    # Example usage
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
        lock_info=lock_info,
        lock_frame=lock_frame,
        show=True
    )
    
    analyzer.process_on_single_video()