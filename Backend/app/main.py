import os
import sys
import signal
from fastapi import FastAPI
from api import v1, v2
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from db.base import create_tables
from core.config import settings_network

# Import all models để SQLAlchemy registry biết về relationships
from models.user import User
from models.TokenLLM import TokenLLM

# Ưu tiên DirectShow, tắt MSMF để tránh kẹt Ctrl+C trên Windows
os.environ["OPENCV_VIDEOIO_PRIORITY_MSMF"] = "0"
os.environ["OPENCV_VIDEOIO_PRIORITY_DSHOW"] = "1"

# Tránh xung đột OpenMP (NumPy/PyTorch/OpenCV)
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
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
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

# Đăng ký signal handler
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

@app.get(
    path='/',
    tags=["Root"],
    summary="Redirect to Frontend",
    description="Redirect người dùng đến trang Frontend",
    include_in_schema=False  # Ẩn khỏi docs vì chỉ là redirect
)
def direct_home():
    return RedirectResponse(url= settings_network.URL_FRONTEND)

# API Routers với tags và descriptions rõ ràng
app.include_router(
    v1.api_auth.router, 
    prefix="/api/v1", 
    tags=["Authentication"],
)
app.include_router(
    v1.api_user.router, 
    prefix="/api/v1/users", 
    tags=["User Management"],
)
app.include_router(
    v1.api_vehicles_frames.router, 
    prefix="/api/v1", 
    tags=["Traffic Monitoring"],
)
app.include_router(
    v1.api_chatbot.router, 
    prefix="/api/v1", 
    tags=["AI Chatbot"],
)
app.include_router(
    v1.api_admin.router, 
    prefix="/api/v1/admin", 
    tags=["Admin Tools"],
)

# V2 APIs (commented out)
# app.include_router(v2.api_chatbot.router, prefix="/api/v2", tags=["AI Chatbot V2"])
# app.include_router(v2.api_vehicles_frames.router, prefix="/api/v2", tags=["Traffic Monitoring V2"])

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
    if v1.state.analyzer:
        v1.state.analyzer.cleanup_processes()
    # if v2.state.analyzer:
    #     v2.state.analyzer.cleanup_processes()
