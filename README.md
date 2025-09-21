# Smart Transportation System

Real-time traffic monitoring and analytics using FastAPI (backend), React + Vite (frontend), and WebSockets for live streaming of frames and metrics.

## Demo

![Demo](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo.png)
![Demo 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo2.png)
![Dashboard](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad.png)
![Dashboard 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad2.png)
![Chatbot](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot1.png)
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

### Docker

#### Quick Start with Docker Compose

The easiest way to run the entire system is using Docker Compose:

```bash
# From the project root directory
docker compose up --build

# Run in background
docker compose up --build -d

# Stop services
docker compose down
```

This will start both the FastAPI backend and React frontend:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

#### Individual Docker Builds

**Backend (FastAPI):**

```bash
cd app

# CPU version
docker build -t smart-transport-backend-cpu --build-arg DEVICE=cpu .

# GPU version (requires NVIDIA Docker)
docker build -t smart-transport-backend-gpu --build-arg DEVICE=gpu .

# Run backend container
docker run -p 8000:8000 -v ./video_test:/app/video_test smart-transport-backend-cpu
```

**Frontend (React):**

```bash
# From project root
docker build -t smart-transport-frontend .

# Run frontend container
docker run -p 5173:5173 smart-transport-frontend
```

#### Docker Compose Configuration

The `docker-compose.yml` file includes:

- **Backend service**: FastAPI with CPU/GPU support
- **Frontend service**: React development server
- **Volume mounting**: Video test files are mounted from `./app/video_test`
- **Network**: Services communicate through a custom network

#### Environment Variables for Docker

Create a `.env` file in the project root for Docker Compose:

```env
# Backend configuration
DEVICE=cpu  # or 'gpu' for GPU support

# Optional: Google API key for chatbot
GOOGLE_API_KEY=your_google_api_key_here

# Frontend API endpoints (optional overrides)
VITE_API_HTTP_BASE=http://localhost:8000
VITE_API_WS_BASE=ws://localhost:8000
```

#### GPU Support

For GPU support, ensure you have:
1. NVIDIA Docker runtime installed
2. NVIDIA drivers on your host system
3. Change `DEVICE: gpu` in `docker-compose.yml` or use `--build-arg DEVICE=gpu`

```bash
# GPU version with Docker Compose
docker compose up --build --build-arg DEVICE=gpu
```

#### Troubleshooting Docker

- **Port conflicts**: Ensure ports 8000 and 5173 are not in use
- **Video files**: Place test videos in `app/video_test/` directory
- **Build cache**: Use `--no-cache` flag if builds fail: `docker compose build --no-cache`
- **Logs**: Check container logs with `docker compose logs [service_name]`

## Configuration

Frontend base URLs are centralized in `src/config.ts` and can be overridden using Vite env vars:

```env
VITE_API_HTTP_BASE=http://localhost:8000
VITE_API_WS_BASE=ws://localhost:8000
```

## API (FastAPI)

Endpoints currently exposed by `app/main.py`:

- GET `/road_name` — list of road names currently processed
- GET `/frames/{road_name}` — latest frame (base64) for one road
- GET `/info/{road_name}` — latest traffic metrics for one road (HTTP)
- WS `/ws/frames/{road_name}` — continuous frames for one road
- WS `/ws/info/{road_name}` — continuous traffic metrics for one road
- POST `/chat` — AI assistant

HTTP examples:

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

Curl:
```bash
# road list
curl http://localhost:8000/road_name

# one road info
curl http://localhost:8000/info/%E2%80%9CNguy%E1%BB%85n%20Tr%C3%A3i%E2%80%9D

# chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Traffic on Nguyen Trai?"}'
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
