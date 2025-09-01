from ultralytics import YOLO

def export_to_openvino(pt_path: str, output_dir: str = None):
    model = YOLO(pt_path)

    # Xuất sang OpenVINO IR
    model.export(format="openvino", dynamic=True,  optimize=True, int8 = True)

    print("✅ Xuất model OpenVINO thành công!")

if __name__ == "__main__":
    # Ví dụ: đổi "best.pt" thành file model của bạn
    export_to_openvino(r"G:\smart-transportation-system\app\best.pt")
