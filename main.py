# server_latest_frame.py

import asyncio
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from threading import Thread, Lock
app = FastAPI()


# --- Thêm CORS ---
origins = [
    "*",  # hoặc cụ thể: "http://your-frontend-domain:port"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_frame = None
frame_lock = Lock()

def frame_producer(video_path: str, width: int, height: int, jpeg_quality: int, fps: float):
    global latest_frame
    cap = cv2.VideoCapture(video_path)
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                # nếu video hết thì có thể lặp lại hoặc break
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # resize
            frame_small = cv2.resize(frame, (width, height))

            # encode JPEG
            success, encoded = cv2.imencode('.jpg', frame_small, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality])
            if not success:
                continue

            data = encoded.tobytes()

            # cập nhật frame mới nhất
            with frame_lock:
                latest_frame = data

            # sleep producer theo fps
            time_to_sleep = 1.0 / fps
            # dùng time.sleep vì chạy trong thread
            import time
            time.sleep(time_to_sleep)
    finally:
        cap.release()

@app.websocket("/ws/frames_latest")
async def websocket_frames_latest(ws: WebSocket):
    global latest_frame
    await ws.accept()
    try:
        while True:
            # lấy frame mới nhất, nếu chưa có thì chờ
            if latest_frame is None:
                await asyncio.sleep(0.01)
                continue

            # copy frame để tránh bị thay đổi giữa chừng
            with frame_lock:
                data = latest_frame

            # gửi
            await ws.send_bytes(data)

            # throttle: gửi mỗi khoảng nhỏ
            await asyncio.sleep(1.0 / 30)  # 30 fps hoặc thấp hơn nếu cần
    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        pass
@app.get("/")
def read_index():
    # trả về file index.html
    from fastapi.responses import FileResponse
    return FileResponse("client.html")

if __name__ == "__main__":
    # khởi producer trong thread riêng
    producer_thread = Thread(target=frame_producer, args=("app/video_test/Đường Láng.mp4", 640, 360, 70, 30), daemon=True)
    producer_thread.start()

    uvicorn.run("main:app", host="0.0.0.0", port=8000)
