from api import veheicles_frames_api
from fastapi import FastAPI
from api import chat_api
from api import state
from services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from services.ChatBot import ChatBot
from fastapi.middleware.cors import CORSMiddleware
import config
app = FastAPI()
# Cho phép gọi API từ frontend khác port (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Có thể chỉnh lại cho chặt hơn nếu cần
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def start_up():
    if state.analyzer is None:
        state.analyzer = AnalyzeOnRoadForMultiprocessing(show= False,
                                            show_log= False,
                                            is_join_processes= False,
                                            path_videos= config.PATH_VIDEOS,
                                            meter_per_pixels= config.METER_PER_PIXELS,
                                            regions= config.REGIONS)
        state.analyzer.run_multiprocessing()
    
    if state.chat_bot is None:
        state.chat_bot = ChatBot()

app.include_router(chat_api.router, prefix="", tags=["post chat"])
app.include_router(veheicles_frames_api.router, prefix="", tags=["veheicles and frames of processes"])

@app.on_event("shutdown")
def shutdown():
    state.analyzer.join_process()
    
    
    
# 1. @app.on_event("startup")
#    Khi server FastAPI khởi động, hàm này sẽ được gọi tự động.
#    Mục đích: Khởi tạo đối tượng analyze_multi (phân tích đa luồng) nếu chưa có.
#    Gọi analyze_multi.process() để bắt đầu xử lý các video ngay khi server chạy.

# Lưu ý về luồng:
# - Khi chạy FastAPI (bằng uvicorn/gunicorn), server sẽ giữ tiến trình chạy liên tục để lắng nghe request
#  HTTP.
# - Các thread bạn tạo trong analyze_multi.process() (mặc định daemon=False) sẽ tiếp tục chạy song song 
# với main thread của FastAPI.
# - FastAPI/uvicorn sẽ KHÔNG kết thúc chương trình cho đến khi bạn dừng server (Ctrl+C hoặc kill process).
# - Vì vậy, không cần join() các thread phân tích video, chương trình vẫn không bị thoát vì event loop 
# của FastAPI vẫn giữ tiến trình sống.
# - Nếu chạy script này như một script Python bình thường (không phải FastAPI server), main thread kết 
# thúc sẽ làm các thread con daemon=True bị dừng theo.
# - Nhưng với FastAPI, tiến trình server luôn sống, nên các thread phân tích vẫn tiếp tục chạy song song.