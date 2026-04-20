import os
from dotenv import load_dotenv
import numpy as np

load_dotenv()
DATABASE_USERNAME = os.getenv("DATABASE_USERNAME")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_PORT = os.getenv("DATABASE_PORT")
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_NAME = os.getenv("DATABASE_NAME")


def _env_bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name, str(default))
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return default


class SettingServer:
    PROJECT_NAME = "FastAPI CRUD with JWT"
    DATABASE_URL = f"postgresql+asyncpg://{DATABASE_USERNAME}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
    SQL_ECHO = _env_bool("SQL_ECHO", "false")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", os.getenv("ACCESS_KEY", "minioadmin"))
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", os.getenv("SECRET_KEY", "minioadmin"))
    MINIO_SECURE = _env_bool("MINIO_SECURE", "false")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "road-frames")
    MINIO_URL_EXPIRY_SECONDS = max(60, _env_int("MINIO_URL_EXPIRY_SECONDS", 3600))
    MINIO_PUBLIC_ENDPOINT = os.getenv("MINIO_PUBLIC_ENDPOINT", MINIO_ENDPOINT)
    MINIO_PUBLIC_SCHEME = os.getenv("MINIO_PUBLIC_SCHEME", "https" if MINIO_SECURE else "http")
    MINIO_IMAGE_URL_MODE = os.getenv("MINIO_IMAGE_URL_MODE", "presigned").strip().lower()
    MINIO_AUTO_SET_PUBLIC_READ = _env_bool("MINIO_AUTO_SET_PUBLIC_READ", "false")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    LOG_FILE_NAME = os.getenv("LOG_FILE_NAME", "app.log")
    LOG_FILE_MAX_BYTES = _env_int("LOG_FILE_MAX_BYTES", 5242880)
    LOG_FILE_BACKUP_COUNT = _env_int("LOG_FILE_BACKUP_COUNT", 5)
    LOG_TO_CONSOLE = _env_bool("LOG_TO_CONSOLE", "false")
    CHAT_MAX_SHORT_TERM_MESSAGES = max(6, _env_int("CHAT_MAX_SHORT_TERM_MESSAGES", 24))
    CHAT_LONG_TERM_MEMORY_LIMIT = max(1, _env_int("CHAT_LONG_TERM_MEMORY_LIMIT", 3))
    CHAT_MEMORY_DB_URI = os.getenv(
        "CHAT_MEMORY_DB_URI",
        DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"),
    )
    OPENCV_VIDEOIO_PRIORITY_MSMF = os.getenv("OPENCV_VIDEOIO_PRIORITY_MSMF", "0")
    OPENCV_VIDEOIO_PRIORITY_DSHOW = os.getenv("OPENCV_VIDEOIO_PRIORITY_DSHOW", "1")
    KMP_DUPLICATE_LIB_OK = os.getenv("KMP_DUPLICATE_LIB_OK", "TRUE")
    # DATABASE_URL = 'postgresql+psycopg_async://neondb_owner:npg_JEOMv5puo3wz@ep-mute-glade-ad2qnbo9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    JWT_SECRET = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS"))

class SettingMetricTransport:
    REGIONS = [
        np.array([[0, 400], [0, 180], [370, 130], [540, 130], [490, 400]]),
        np.array([[230, 400], [90, 260], [350, 200], [600, 320], [600, 400]]),
        np.array([[0, 400], [0, 180], [150, 70], [480, 70], [600, 260], [600, 400]]),
        np.array([[140, 400], [400, 200], [550, 200], [530, 400]]),
        np.array([[50, 400], [50, 320], [390, 130], [550, 220], [480, 400]]),
    ]

    PATH_VIDEOS = [
        "./video_test/Văn Quán.mp4",
        "./video_test/Văn Phú.mp4",
        "./video_test/Nguyễn Trãi.mp4",
        "./video_test/Ngã Tư Sở.mp4",
        "./video_test/Đường Láng.mp4",
    ]

    METER_PER_PIXELS = [
                        0.034,
                        0.036,
                        0.018,
                        0.066,
                        0.029
                        ]
    MODELS_PATH = r'./ai_models/model N/openvino models/best_int8_openvino_model'

    DEVICE = 'cpu'

class SettingChatBot:
    from langchain_google_genai import ChatGoogleGenerativeAI

    LLM = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview",
                                temperature=0.4, 
                                max_output_tokens=1024
                                )
    # Dùng ollama local api llm
    
    # from langchain_openai import OpenAI
    # LLM = OpenAI(model_name="gemma3:4b",
    #              temperature=0.6,
    #              max_tokens=1024)

class SettingNetwork:
    BASE_URL_API = "http://localhost:8000"
    URL_FRONTEND = "http://localhost:5173"

settings_server = SettingServer()
settings_metric_transport = SettingMetricTransport()
settings_chat_bot = SettingChatBot()
settings_network = SettingNetwork()
setting_chatbot = SettingChatBot()

# ================= Traffic Thresholds (per-road) =================
# v: average speed threshold (km/h) - >= v => fast, else slow
# c1: vehicle count threshold for busy
# c2: vehicle count threshold for congested

from typing import Dict, TypedDict


class RoadThreshold(TypedDict):
    v: int
    c1: int
    c2: int


TRAFFIC_THRESHOLDS: Dict[str, RoadThreshold] = {
    "Đường Láng": {"v": 18, "c1": 12, "c2": 20},
    "Ngã Tư Sở": {"v": 19, "c1": 35, "c2": 47},
    "Nguyễn Trãi": {"v": 18, "c1": 12, "c2": 22},
    "Văn Quán": {"v": 17, "c1": 8, "c2": 15},
    "Văn Phú": {"v": 18, "c1": 12, "c2": 23},
}

DEFAULT_THRESHOLD: RoadThreshold = {"v": 15, "c1": 15, "c2": 25}


