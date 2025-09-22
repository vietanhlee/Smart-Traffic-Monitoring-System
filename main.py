# server.py
import asyncio
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn

app = FastAPI()

@app.websocket("/ws/frames")
async def websocket_frames(ws: WebSocket):
    await ws.accept()
    cap = cv2.VideoCapture(r'app/video_test/Đường Láng.mp4')  # hoặc đường dẫn/video input
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.01)
                continue

            # resize nếu muốn giảm băng thông
            frame_small = cv2.resize(frame, (640, 360))  # chỉnh theo nhu cầu

            # nén thành JPEG (tùy chỉnh quality để giảm size)
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]  # 0-100
            success, encoded = cv2.imencode('.jpg', frame_small, encode_param)
            if not success:
                continue

            data = encoded.tobytes()
            # gửi binary bytes qua websocket (không base64)
            await ws.send_bytes(data)

            # nếu muốn throttle FPS
            await asyncio.sleep(1/30)  # 15 fps
    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        cap.release()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
