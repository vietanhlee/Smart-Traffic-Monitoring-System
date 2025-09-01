# from PIL import Image
# from surya.foundation import FoundationPredictor
# from surya.recognition import RecognitionPredictor
# from surya.detection import DetectionPredictor

# image = Image.open(r"F:\Document\DRL\462572123_860164909346997_6767406929214526848_n.jpg")
# foundation_predictor = FoundationPredictor()
# recognition_predictor = RecognitionPredictor(foundation_predictor)
# detection_predictor = DetectionPredictor()
 
# predictions = recognition_predictor([image], det_predictor=detection_predictor)

# # print(predictions)
# from ultralytics import YOLO

# # # 1. Load mô hình .pt
# model = YOLO(r"G:\smart-transportation-system\app\best.pt")

# # 2. Xuất sang ONNX
# # Hiện tại ultralytics chỉ hỗ trợ export ONNX (fp32/fp16),
# # chưa hỗ trợ int8 trực tiếp khi export.
# model.export(
#     format="onnx",  # Xuất ra ONNX
# )
from onnxruntime.quantization import quantize_dynamic, QuantType

# File đầu vào FP32 hoặc FP16
model_fp32 = r"G:\smart-transportation-system\app\best.onnx"
model_int8 = "best-int8.onnx"

# Quantization động (Dynamic Quantization)
quantize_dynamic(
    model_input=model_fp32, 
    model_output=model_int8,
    weight_type=QuantType.QUInt8  # INT8
)

print("✅ Exported INT8 model:", model_int8)
