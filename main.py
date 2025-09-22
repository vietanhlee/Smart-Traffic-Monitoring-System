# main.py
import asyncio
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from threading import Thread, Lock
import time
import os

app = FastAPI()

# CORS middleware
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
latest_frame = None
frame_lock = Lock()
is_running = False

def frame_producer(video_path: str, width: int, height: int, jpeg_quality: int, fps: float):
    global latest_frame, is_running
    
    # Kiểm tra xem file video có tồn tại không
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        return
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video file {video_path}")
        return
    
    print(f"Starting video producer: {video_path}")
    is_running = True
    
    try:
        while is_running:
            ret, frame = cap.read()
            if not ret:
                # Nếu video hết thì lặp lại
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # Resize frame
            frame_small = cv2.resize(frame, (width, height))

            # Encode to JPEG
            success, encoded = cv2.imencode(
                '.jpg', 
                frame_small, 
                [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality]
            )
            if not success:
                continue

            data = encoded.tobytes()

            # Cập nhật frame mới nhất
            with frame_lock:
                latest_frame = data

            # Sleep theo fps
            time_to_sleep = 1.0 / fps
            time.sleep(time_to_sleep)
            
    except Exception as e:
        print(f"Error in frame producer: {e}")
    finally:
        cap.release()
        print("Video capture released")

@app.websocket("/ws/frames_latest")
async def websocket_frames_latest(ws: WebSocket):
    global latest_frame
    await ws.accept()
    print("WebSocket client connected")
    
    try:
        while True:
            # Chờ cho đến khi có frame
            if latest_frame is None:
                await asyncio.sleep(0.01)
                continue

            # Copy frame để tránh race condition
            with frame_lock:
                data = latest_frame

            # Gửi frame
            await ws.send_bytes(data)

            # Throttle gửi (30fps max)
            await asyncio.sleep(1.0 / 30)
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.get("/")
async def read_index():
    return FileResponse("client.html")

@app.get("/status")
async def get_status():
    return {
        "running": is_running,
        "has_frame": latest_frame is not None
    }

if __name__ == "__main__":
    # Đường dẫn video - thay đổi theo đường dẫn thực tế của bạn
    video_path = "app/video_test/Đường Láng.mp4"  # Đặt file video trong cùng thư mục
    
    # Kiểm tra file video tồn tại
    if not os.path.exists(video_path):
        print(f"Please put your video file '{video_path}' in the same directory as this script")
        print("Or update the video_path variable to point to your video file")
        exit(1)
    
    # Khởi động producer thread
    producer_thread = Thread(
        target=frame_producer, 
        args=(video_path, 640, 360, 70, 30),
        daemon=True
    )
    producer_thread.start()
    
    print("Starting server on http://localhost:8000")
    print("WebSocket endpoint: ws://localhost:8000/ws/frames_latest")
    
    # Chạy server
    uvicorn.run(app, host="0.0.0.0", port=8000)