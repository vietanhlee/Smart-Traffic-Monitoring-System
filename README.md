# Smart Transportation Monitoring System

An intelligent traffic monitoring system that uses AI to detect and track vehicles in real time. It provides a live dashboard, REST/WebSocket APIs, and an AI chatbot for traffic queries.

## Architecture Overview

![](https://raw.githubusercontent.com/vietanhlee/Smart-Traffic-Monitoring-System/refs/heads/main/.github/architech.png)

## Short Demo

https://github.com/user-attachments/assets/143d2063-2be7-40d9-a1ea-3e07eed10ddb

## Features

- Real-time vehicle detection and tracking (YOLO + ByteTrack)
- Multi-camera processing with multiprocessing
- Live dashboard with traffic analytics
- REST + WebSocket APIs for realtime data
- WebRTC low-latency video streaming
- AI chatbot (LangGraph ReAct) for natural language queries
- Model optimization with INT8 OpenVINO and TensorRT
- Model pruning with torch-pruning (see prune.py and readme_torch_prunning.md)
- CPU and GPU support

## Tech Stack

- **Backend:** FastAPI, Python
- **Frontend:** React, TypeScript, Vite
- **Cache/Queue:** Redis
- **Object Storage:** MinIO
- **Database:** PostgreSQL
- **AI/ML:** YOLO, ByteTrack, LangGraph

## Requirements

- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- Redis
- MinIO
- gdown (for downloading sample videos)
- NVIDIA GPU (optional)

## Setup

### Manual

1. Copy environment files:

```bash
# macOS/Linux
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Windows PowerShell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

2. Edit the `.env` files to match your local services and secrets:

- If Redis or MinIO are already running, update `REDIS_URL` and `MINIO_*` to match.
- If not installed, install and start Redis and MinIO, then update the values in `backend/.env`.

3. Download sample videos into `backend/app/video_test`:

```bash
cd backend/app
gdown --folder https://drive.google.com/drive/folders/1gkac5U5jEs174p7V7VC3rCmgvO_cVwxH
```

4. Install backend dependencies:

```bash
cd backend
pip install -r requirements_cpu.txt  # or requirements_gpu.txt
```

5. Install frontend dependencies:

```bash
cd frontend
npm install pnpm
pnpm install
```

6. Run the backend:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

7. Run the frontend:

```bash
cd frontend
pnpm run dev
```

Backend: http://localhost:8000
Frontend: http://localhost:5173

### Docker

1. Copy environment files (same as manual).
2. Ensure `backend/app/video_test` contains the sample videos (use `gdown` if needed).
3. Start services:

```bash
docker compose up --build
```

GPU build (optional):

```bash
DEVICE=gpu docker compose up --build
```

Backend: http://localhost:8000
Frontend: http://localhost:5173

## Main APIs (v1)

Base prefix: `/api/v1`

### REST

**Auth**

- `POST /auth/register` - Create a new account
- `POST /auth/login` - Login and receive JWT
- `GET /auth/me` - Get current user profile

**User**

- `PUT /user/password` - Change password
- `PUT /user/profile` - Update profile info

**Traffic**

- `GET /road/roads_name` - List monitored roads
- `GET /road/info/{road_name}` - Current traffic stats (counts, speeds, status)
- `GET /road/history/{road_name}` - Traffic history (paginated)
- `POST /road/webrtc/offer/{road_name}` - WebRTC session setup (SDP offer -> answer)

**Chat**

- `POST /chatbot/chat` - Send a message to the AI assistant

**Chat History**

- `GET /chat-history/messages` - List chat messages
- `POST /chat-history/messages` - Save a message
- `DELETE /chat-history/messages` - Clear all messages
- `DELETE /chat-history/messages/{message_id}` - Delete a message
- `GET /chat-history/messages/count` - Count messages

**Admin**

- `GET /admin/resources` - System metrics (CPU, RAM, Disk, Network)
- `GET /admin/traffic/status` - Worker status per road
- `POST /admin/traffic/roads/{road_name}/start` - Start a road worker
- `POST /admin/traffic/roads/{road_name}/stop` - Stop a road worker

### Realtime (WebSocket / WebRTC)

- `WS /road/ws/frames/{road_name}` - JPEG frame stream
- `WS /road/ws/info/{road_name}` - Realtime traffic metrics
- `WS /road/ws/chart/{road_name}` - Realtime chart data
- `WS /chatbot/ws/chat` - Realtime chat stream
- `POST /road/webrtc/offer/{road_name}` - WebRTC signaling for low-latency video

## Authentication

Most endpoints require JWT. Admin endpoints require admin role.

Header:

```
Authorization: Bearer <TOKEN>
```

WebSocket query:

```
?token=<TOKEN>
```

## API Docs

Swagger UI: http://localhost:8000/docs

