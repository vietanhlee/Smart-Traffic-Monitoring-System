from services.road_services.analyze_on_road_for_multi_processing import AnalyzeOnRoadForMultiprocessing
from services.chat_services.chat_bot_agent import ChatBotAgent
from services.road_services.traffic_history_worker import TrafficHistoryWorker


analyzer : AnalyzeOnRoadForMultiprocessing | None = None
agent : ChatBotAgent | None = None
traffic_history_worker : TrafficHistoryWorker | None = None

