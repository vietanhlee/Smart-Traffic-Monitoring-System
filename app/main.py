from fastapi import FastAPI
from api import chat_bot, analyze_transportation
from api.dependencies import analyzer, chat_bot

# analyzer = AnalyzeOnRoadForMultiprocessing(show= False,
#                                            show_log= False,
#                                            is_join_processes= False)
# chat_bot = ChatLLM()

app = FastAPI()

@app.on_event("start_up")
async def start_up():
    analyzer.run_multiprocessing()
    # print("Đã chạy các process")

app.include_router(router= chat_bot.router, prefix= "/")
app.include_router(router= analyze_transportation.router, prefix="/")



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