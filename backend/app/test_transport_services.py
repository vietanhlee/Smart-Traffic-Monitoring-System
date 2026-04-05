from services.road_services.AnalyzeOnRoadBase import AnalyzeOnRoadBase
from core.config import settings_metric_transport

if __name__ == "__main__":
    # Example usage
    path_video = settings_metric_transport.PATH_VIDEOS[3]
    meter_per_pixel = settings_metric_transport.METER_PER_PIXELS[3]

    analyzer = AnalyzeOnRoadBase(
        path_video=path_video,
        meter_per_pixel=meter_per_pixel,
        region=settings_metric_transport.REGIONS[3],
        show=True,
        infer_every_n_frames=1,
        model_path= r'G:\smart-transportation-system\backend\app\ai_models\model N\onnx models\best.pt',
    )

    analyzer.process_on_single_video()