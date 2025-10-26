import os
import sys
import signal
from api.v1 import api_vehicles_frames
from fastapi import FastAPI
from api.v1 import api_chatbot
from api.v1 import api_auth
from api.v1 import state
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from db.base import create_tables

# Ưu tiên DirectShow, tắt MSMF để tránh kẹt Ctrl+C trên Windows
os.environ["OPENCV_VIDEOIO_PRIORITY_MSMF"] = "0"
os.environ["OPENCV_VIDEOIO_PRIORITY_DSHOW"] = "1"

# Tránh xung đột OpenMP (NumPy/PyTorch/OpenCV)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def signal_handler(signum, frame):
    """Xử lý Ctrl+C"""
    print("\nĐang shutdown server...")
    if state.analyzer:
        state.analyzer.cleanup_processes()
    sys.exit(0)

# Đăng ký signal handler
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

@app.get(path= '/')
def direct_home():
    return RedirectResponse(url= 'http://localhost:5173/')

app.include_router(api_chatbot.router, prefix="", tags=["post chat"])
app.include_router(api_vehicles_frames.router, prefix="", tags=["vehicles and frames of processes"])
app.include_router(api_auth.router, prefix="", tags=["auth"])

# Import and include router for user management APIs
from api.v1 import api_user
app.include_router(api_user.router, prefix="/users", tags=["users"])

@app.on_event("startup")
async def startup_event():
    """Tạo bảng database khi khởi động"""
    print("Creating database tables...")
    try:
        await create_tables()
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {e}")
        raise e

@app.on_event("shutdown")
def shutdown():
    print("Shutdown event triggered...")
    if state.analyzer:
        state.analyzer.cleanup_processes()
    
    
"""Lưu ý về luồng:
- Khi chạy FastAPI (bằng uvicorn/gunicorn), server sẽ giữ tiến trình chạy liên tục để lắng nghe request
 HTTP.
- Các thread tạo trong analyze_multi.process() (mặc định daemon=False) sẽ tiếp tục chạy song song 
với main thread của FastAPI.
- FastAPI/uvicorn sẽ KHÔNG kết thúc chương trình cho đến khi bạn dừng server (Ctrl+C hoặc kill process).
- Vì vậy, không cần join() các thread phân tích video, chương trình vẫn không bị thoát vì event loop 
của FastAPI vẫn giữ tiến trình sống.
- Nếu chạy script này như một script Python bình thường (không phải FastAPI server), main thread kết 
thúc sẽ làm các thread con daemon=True bị dừng theo.
- Nhưng với FastAPI, tiến trình server luôn sống, nên các thread phân tích vẫn tiếp tục chạy song song."""