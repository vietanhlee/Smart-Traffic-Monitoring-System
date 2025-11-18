import os
import sys
import signal

# Ensure the backend/app directory is on sys.path so sibling modules (api, models, etc.) are importable.
app_path = os.path.dirname(os.path.abspath(__file__))
if app_path not in sys.path:
    sys.path.insert(0, app_path)
from fastapi import FastAPI
from api import v1
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from db.base import create_tables
from core.config import settings_network

os.environ["OPENCV_VIDEOIO_PRIORITY_MSMF"] = "0"
os.environ["OPENCV_VIDEOIO_PRIORITY_DSHOW"] = "1"

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"


app = FastAPI(
    title="Smart Transportation System API",
    description="""
    Real-time Traffic Monitoring & AI Assistant
    
    API cung cấp:
    - Real-time video streaming và phân tích giao thông
    - AI Chatbot hỗ trợ thông tin giao thông
    - Analytics và metrics về lưu lượng xe
    - User authentication và management
    - Admin tools và system monitoring
    
    """,
    version="1.0.0",
    docs_url="/docs",  
    redoc_url="/redoc", 
    contact={
        "name": "Lê Việt Anh",
        "email": "levietanhtrump@gmail.com",
    },
    
)

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
    if v1.state.analyzer:
        v1.state.analyzer.cleanup_processes()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


@app.on_event("startup")
async def startup_event():
    """Tạo bảng database khi khởi động"""
    print("Creating database tables...")
    try:
        await create_tables()
        print("Tạo xong bảng database.")
    except Exception as e:
        print(f"Lỗi tạo bảng database: {e}")
        raise e

@app.on_event("shutdown")
def shutdown():
    print("Tắt mọi thứ...")
    if v1.state.analyzer:
        v1.state.analyzer.cleanup_processes()

@app.get(
    path='/',
    tags=["Root"],
    summary="Redirect to Frontend",
    description="Redirect người dùng đến trang Frontend"
)
def direct_home():
    return RedirectResponse(url= settings_network.URL_FRONTEND)

app.include_router(
    router= v1.api_auth.router, 
    prefix="/api/v1", 
    tags=["Authentication"],
)
app.include_router(
    router= v1.api_user.router, 
    prefix="/api/v1/users", 
    tags=["User Management"],
)
app.include_router(
    router= v1.api_vehicles_frames.router, 
    prefix="/api/v1", 
    tags=["Traffic Monitoring"],
)
app.include_router(
    router= v1.api_chatbot.router, 
    prefix="/api/v1", 
    tags=["AI Chatbot"],
)
app.include_router(
    router= v1.chat_history.router,
    prefix="/api/v1/chat",
    tags=["Chat History"],
)
app.include_router(
    router= v1.api_admin.router,
    prefix="/api/v1", 
    tags=["Admin Tools"],
)
