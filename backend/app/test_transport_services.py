from services.road_services.analyze_on_road_base import AnalyzeOnRoadBase
from core.config import settings_metric_transport

if __name__ == "__main__":
    # Example usage
    path_video = settings_metric_transport.PATH_VIDEOS[2]
    meter_per_pixel = settings_metric_transport.METER_PER_PIXELS[2]

    analyzer = AnalyzeOnRoadBase(
        path_video=path_video,
        meter_per_pixel=meter_per_pixel,
        region=settings_metric_transport.REGIONS[2],
        show=True,
        infer_every_n_frames=1,
        model_path= r'G:\smart-transportation-system\backend\app\ai_models\model N\openvino models\best_int8_openvino_model',
    )

    analyzer.process_on_single_video()