import os
import sys
import signal
from contextlib import asynccontextmanager
from types import FrameType
from fastapi import FastAPI
from api import v1
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from db.base import create_tables
from core.config import settings_network, settings_server
from core.logging_config import get_logger, setup_logging

os.environ.setdefault("OPENCV_VIDEOIO_PRIORITY_MSMF", settings_server.OPENCV_VIDEOIO_PRIORITY_MSMF)
os.environ.setdefault("OPENCV_VIDEOIO_PRIORITY_DSHOW", settings_server.OPENCV_VIDEOIO_PRIORITY_DSHOW)
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", settings_server.KMP_DUPLICATE_LIB_OK)

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý vòng đời ứng dụng: startup và shutdown."""
    logger.info("Creating database tables...")
    try:
        await create_tables()
        logger.info("Database tables initialized.")
    except Exception as e:
        logger.exception("Failed to initialize database tables: %s", e)
        raise

    try:
        yield
    finally:
        logger.info("Shutting down application resources...")
        if getattr(v1.state, "agent", None):
            try:
                v1.state.agent.close()
            except Exception:
                logger.exception("Failed to close chat agent resources")
        if v1.state.traffic_history_worker:
            await v1.state.traffic_history_worker.stop()
        if v1.state.analyzer:
            v1.state.analyzer.cleanup_processes()


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
    lifespan=lifespan,
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

def _signal_handler(signum: int, frame: FrameType | None):
    """Xử lý Ctrl+C"""
    _ = frame
    logger.warning("Received signal %s. Stopping server...", signum)
    if v1.state.analyzer:
        v1.state.analyzer.cleanup_processes()
    sys.exit(0)

signal.signal(signal.SIGINT, _signal_handler)
signal.signal(signal.SIGTERM, _signal_handler)

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
