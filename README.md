# Smart Transportation System

Real-time traffic monitoring and analytics using FastAPI (backend), React + Vite (frontend), and WebSockets for live streaming of frames and metrics.

## Demo

![Demo](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo.png)
![Demo 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo2.png)
![Dashboard](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad.png)
![Dashboard 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad2.png)
![Chatbot](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot.png)
![Chatbot 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot2.png)

## Overview

- Processes multiple road camera videos in parallel, detects/tracks vehicles, and computes metrics (vehicle counts and average speeds) per road.
- Serves traffic data and frames through FastAPI.
- Streams data to the frontend using WebSockets for low-latency visualization.
- Includes an AI assistant endpoint for chat-based queries.

## Requirements

- Python 3.11+
- Node.js 18+
- Backend Python deps: `app/requirements_cpu.txt` or `app/requirements_gpu.txt`
- Browser: Chrome/Edge/Firefox

## Data

Download demo videos and put them under the backend as instructed (e.g., `app/video_test/`).

## Setup

### Backend

```bash
cd app

# CPU
pip install -r requirements_cpu.txt

# or GPU
pip install -r requirements_gpu.txt

# (Optional) Chat LLM
echo GOOGLE_API_KEY=your_google_api_key_here > .env

# Run FastAPI
uvicorn main:app --reload
# FastAPI: http://127.0.0.1:8000
```

### Frontend

```bash
# From repo root
npm install

# Configure API endpoints (optional overrides)
echo VITE_API_HTTP_BASE=http://localhost:8000 > .env
echo VITE_API_WS_BASE=ws://localhost:8000 >> .env

npm run dev
# Vite: http://localhost:5173
```

## Configuration

Frontend base URLs are centralized in `src/config.ts` and can be overridden using Vite env vars:

```env
VITE_API_HTTP_BASE=http://localhost:8000
VITE_API_WS_BASE=ws://localhost:8000
```

## API (FastAPI)

- GET `/road_name` — list of road names currently processed
- GET `/frames/{road_name}` — latest frame (base64) for one road
- WS `/ws/frames/{road_name}` — continuous frames for one road
- WS `/ws/info/{road_name}` — continuous traffic metrics for one road
- POST `/chat` — AI assistant

Example responses:

Frames (HTTP):
```json
{
  "frame": "<base64-jpeg>"
}
```

Info (WS message):
```json
{
  "count_car": 12,
  "count_motor": 31,
  "speed_car": 32.4,
  "speed_motor": 26.1
}
```

## Architecture

- Video processing: YOLO + tracking (e.g., ByteTrack), multi-processing per video.
- Backend: FastAPI, background workers for analysis, WebSockets for live feeds.
- Frontend: React + Vite; connects to backend via WebSockets using hooks in `src/hooks/useWebSocket.ts`.

## Troubleshooting

- Seeing 404s for `/veheicles` or old `/frames`? Close any legacy tabs (e.g., `FRONTEND_for_testing/index.html`) and hard-reload the Vite app. The current frontend uses `/road_name` and WS endpoints, not `/veheicles`.
- CORS: Backend enables permissive CORS in `app/main.py`. If deploying, restrict `allow_origins`.
- Env changes require restarting the Vite dev server.

## License

MIT (or project’s chosen license)
