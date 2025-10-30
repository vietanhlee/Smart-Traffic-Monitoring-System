# Smart Transportation Monitoring System

A modern transportation monitoring and analysis system with real-time traffic analytics, vehicle detection, and an AI-powered chatbot interface.

## Architecture Overview

### Backend Components

- **Video Processing**
  - YOLO model fine-tuned and optimized with INT8 OpenVINO
  - ByteTrack for object tracking
  - Multi-processing implementation for parallel video analysis
- **API Layer**
  - FastAPI for REST endpoints
  - WebSocket support for real-time data streaming
  - Background workers for continuous video analysis
- **AI Assistant**
  - ReActAgent based on LangGraph
  - Contextual understanding of traffic data
  - Natural language interaction

### Frontend Components

- **Framework**
  - React 18+ with TypeScript
  - Vite for development and building
  - ShadCN UI components
- **Real-time Features**
  - WebSocket integration (`src/hooks/useWebSocket.ts`)
  - Live traffic metrics visualization
  - Interactive video monitoring

### Data Flow

1. Video input → YOLO detection → ByteTrack tracking → Metrics computation
2. FastAPI serves processed data via REST/WebSocket
3. React frontend consumes and visualizes data in real-time
4. AI Agent assistant processes natural language queries about traffic data

## Features

- Real-time traffic monitoring and analytics using AI-powered vehicle detection
- Multi-camera support with parallel video processing
- Interactive dashboard with real-time metrics and visualizations
- AI chatbot for traffic insights and analysis
- WebSocket integration for live streaming of frames and metrics
- Optimized AI models (INT8 OpenVINO) for efficient inference
- Support for both CPU and GPU deployments

## Screenshots

<!-- ![Demo](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo.png)
![Demo 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo2.png)
![Dashboard](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad.png)
![Dashboard 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad2.png)
![Chatbot](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot1.png)
![Chatbot 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot2.png)
![Chatbot3](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot3.png) -->

https://github-production-user-asset-6210df.s3.amazonaws.com/192244549/502966264-43444e24-b3ec-4792-bc23-8d104bf0de7f.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20251019%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251019T105345Z&X-Amz-Expires=300&X-Amz-Signature=ac967febc31665f486d57e477ca399014484634df4cf4a5472082458fcc9981f&X-Amz-SignedHeaders=host

<details>
<summary> <strong>Project Structure</strong></summary>

```
smart-transportation-system
├─ Backend
│  ├─ .dockerignore
│  ├─ .env
│  ├─ app
│  │  ├─ ai_models
│  │  │  ├─ model N
│  │  │  │   └─ bench marks
│  │  │  └─ model S
│  │  │     └─ bench marks
│  │  ├─ api
│  │  │  └─ v1
│  │  │     ├─ api_vehicles_frames.py
│  │  │     └─ state.py
│  │  ├─ core
│  │  │  ├─ config.py
│  │  │  ├─ security.py
│  │  │  └─ __init__.py
│  │  ├─ db
│  │  │  └─ database.py
│  │  ├─ main.py
│  │  ├─ models
│  │  │  └─ user.py
│  │  ├─ schemas
│  │  │  └─ ChatResponse.py
│  │  ├─ services
│  │  │  ├─ chat_services
│  │  │  │  └─ tool_func.py
│  │  │  └─ road_services
│  │  │     ├─ AnalyzeOnRoad.py
│  │  │     ├─ AnalyzeOnRoadBase.py
│  │  │     └─ AnalyzeOnRoadForMultiProcessing.py
│  │  └─ utils
│  │     ├─ jwt_handler.py
│  │     └─ services_utils.py
│  ├─ docker-compose.yml
│  ├─ Dockerfile
│  ├─ requirements_cpu.txt
│  └─ requirements_gpu.txt
├─ docker-compose.yml
├─ Frontend
│  ├─ .dockerignore
│  ├─ components.json
│  ├─ Dockerfile
│  ├─ eslint.config.js
│  ├─ package.json
│  ├─ public
│  │  └─ vite.svg
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ ChatInterface.tsx
│  │  │  ├─ LoadingSpinner.tsx
│  │  │  ├─ TrafficAnalytics.tsx
│  │  │  ├─ TrafficDashboard.tsx
│  │  │  ├─ ui
│  │  │  ├─ VideoModal.tsx
│  │  │  └─ VideoMonitor.tsx
│  │  ├─ config.ts
│  │  ├─ hooks
│  │  │  ├─ use-mobile.ts
│  │  │  └─ useWebSocket.ts
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  └─ vite-env.d.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
└─ README1.md

```

</details>

## Requirements

- Python 3.9 < 3.13
- Node.js 18+
- NVIDIA GPU (optional, for GPU acceleration)
- Backend dependencies: `app/requirements_cpu.txt` or `app/requirements_gpu.txt`
- Frontend dependencies: `package.json`

## Manual Setup

### Backend Setup

1. From project root, navigate to the Backend directory:

```bash
cd Backend/app
```

2. Install Python dependencies:

- For CPU-only installation

```bash
pip install -r requirements_cpu.txt
```

- For GPU support

```
pip install -r requirements_gpu.txt
```

3. For Linux systems, for OpenCV dependencies:

```bash
sudo apt update
sudo apt install -y libgl1
```

4. Download data video:

```bash
gdown --folder https://drive.google.com/drive/folders/1gkac5U5jEs174p7V7VC3rCmgvO_cVwxH
```

5. Configure environment variables:

Create .env file for ChatBot configuration (Optional)

```bash
echo "GOOGLE_API_KEY=your_google_api_key_here" > .env
```

### Frontend Setup

1. From project root, navigate to the Frontend directory and install Node.js dependencies:

```bash
npm install pnpm
```

```bash
pnpm install
```

### Running the Application

1. From Backend directory, start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Server will be available at http://localhost:8000

2. From Frontend directory, start the frontend development server:

```bash
pnpm run dev
```

> Vite dev server will be available at http://localhost:5173

## Configuration

### Frontend Configuration

Base URLs and API endpoints are configured in `src/config.ts` and can be customized using Vite environment variables.

### Backend Configuration

Configured in `core/config.py` and can be customized environment variables.

<details>
<summary> <strong> Docker Deployment  </strong></summary>

### Quick Start with Docker Compose

1. Download test videos (if not already downloaded):

Navigate to Backend/app directory where `videos_test` will be stored

```bash
cd app
```

Install gdown tool for downloading from Google Drive

```bash
pip install gdown
```

Download test videos

```bash
gdown --folder https://drive.google.com/drive/folders/1gkac5U5jEs174p7V7VC3rCmgvO_cVwxH
```

Return to root directory for docker-compose

```bash
cd ..
```

2. Run with Docker Compose:

Build and start all services

```bash
docker compose up --build
```

Or run in background

```bash
docker compose up --build -d
```

Build services individually

```bash
docker compose build fastapi
docker compose build frontend
```

Start services without rebuilding

```bash
docker compose up
```

Check logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f fastapi
docker compose logs -f frontend
```

Stop services

```bash
docker compose down
```

Stop and remove volumes

```bash
docker compose down -v
```

This will start:

- Backend API: http://localhost:8000
- Frontend: http://localhost:5173

### Docker Configuration

The `docker-compose.yml` provides:

- FastAPI backend with CPU/GPU support
- React development server
- Volume mounting for video files (`./app/video_test`)
- Custom network for service communication

### GPU Support

To enable GPU acceleration:

1. Prerequisites:

   - NVIDIA Docker runtime installed
   - NVIDIA drivers on host system

2. Enable GPU support:
   ```bash
   docker compose up --build --build-arg DEVICE=gpu
   ```

### Troubleshooting Docker

- **Port conflicts**: Verify ports 8000 and 5173 are available
- **Video files**: Ensure test videos are in `app/video_test/`
- **Build issues**: Try rebuilding without cache:

  ```bash
  docker compose build --no-cache
  ```

- **Debugging**: Check service logs:
  ```bash
  docker compose logs [service_name]
  ```
  </details>

---

## API Documentation

### REST Endpoints

#### Road Information

- `GET /roads_name`

  - Returns list of road names being processed
  - Response:
    ```json
    {
      "road_names": ["road1", "road2", ...]
    }
    ```

- `GET /frames/{road_name}`

  - Returns latest frame for specified road as raw JPEG bytes
  - Response type: `image/jpeg`
  - Error Response (500):
    ```json
    {
      "error": "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
    }
    ```

- `GET /info/{road_name}`
  - Returns latest traffic metrics for specified road
  - Response:
    ```json
    {
      "count_car": 12,
      "count_motor": 31,
      "speed_car": 32.4,
      "speed_motor": 26.1
    }
    ```
  - Error Response (500):
    ```json
    {
      "error": "Lỗi: Dữ liệu bị lỗi, kiểm tra core"
    }
    ```

#### Chat API

- `POST /chat`
  - Send message to AI assistant
  - Request:
    ```json
    {
      "message": "string"
    }
    ```
  - Response format:
    ```json
    {
      "message": "string",
      "image": list(url to image (byte code))
    }
    ```

### WebSocket Endpoints

- `WS /ws/frames/{road_name}`

  - Streams continuous frames for specified road
  - Message format: Raw JPEG bytes (binary)
  - Frame rate: 15 FPS (sleep 1/15 second between frames)

- `WS /ws/info/{road_name}`

  - Streams continuous traffic metrics for specified road
  - Update interval: Every 5 seconds
  - Message format:
    ```json
    {
      "count_car": 12,
      "count_motor": 31,
      "speed_car": 32.4,
      "speed_motor": 26.1
    }
    ```

- `WS /chat`

  - Basic chatbot WebSocket endpoint
  - Request format:
    ```json
    {
      "message": "string"
    }
    ```
  - Response format:
    ```json
    {
      "message": "string",
      "image": list(url to image (byte code))
    }
    ```

## API Authentication & Usage

### User Registration

`POST /register`

**Request:**

```json
{
  "username": "string",
  "password": "string",
  "email": "user@email.com",
  "phone_number": "string"
}
```

**Response:**

```json
{ "msg": "Register successful" }
// or 400 if duplicate username/email/phone
```

### User Login

`POST /login`

**Request:**

```json
{
  "username": "string", // or use "email"
  "password": "string"
}
```

**Response:**

```json
{ "access_token": "<JWT token>", "token_type": "bearer" }
```

### Token Requirement (VERY IMPORTANT)

**All other API (including /chat, /info, /frames, etc.) require Bearer JWT token.**

- Add `Authorization: Bearer <access_token>` header to EVERY request.

**Example error if token missing/invalid:**

```json
{ "detail": "Token không hợp lệ hoặc đã hết hạn." }
```

---

### Example: Authenticated Chat Request

```bash
# Login to get token:
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "xxx", "password": "xxx"}'

# Save the token, then call:
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"message": "Traffic info"}'
```

---

> **Lưu ý:** Tất cả API trừ /register, /login đều bắt buộc truyền Header `Authorization: Bearer <access_token>`. Thiếu hoặc sai sẽ trả lỗi 401 (Token không hợp lệ).

---

## Protected REST Endpoints (require token)

- `GET /roads_name`
- `GET /frames/{road_name}`
- `GET /info/{road_name}`
- `POST /chat`
- WebSocket endpoints: `ws/frames/{road_name}`, `ws/info/{road_name}`, `ws/chat` –> pass token in the header or via cookie if client supports

---

<details> <summary> <strong> Example Usage </strong> </summary> 
  
- Get list of roads

```bash
curl http://localhost:8000/roads_name
```

- Get traffic info for specific road

```bash
curl http://localhost:8000/info/"Nguyễn Trãi"
```

- Get raw JPEG frame

```bash
curl http://localhost:8000/frames/"Nguyễn Trãi" --output frame.jpg
```

- Send chat message

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Traffic on Nguyen Trai?"}'
```

> Note: For WebSocket endpoints, you'll need to use a WebSocket client or the provided React frontend components.

</details>

---

<details> <summary> <strong> Troubleshooting Guide </strong> </summary>

### Common Issues

1. **API Endpoint Errors**

   - 404 errors for `/vehicles` or legacy `/frames`
   - Solution: Use current endpoints (`/road_name` and WebSocket endpoints)
   - Close legacy tabs (e.g., `FRONTEND_for_testing/index.html`)
   - Hard-reload the Vite app

2. **CORS Issues**

   - Backend uses permissive CORS in development
   - For production: Configure `allow_origins` in `app/main.py`

3. **Environment Changes**
   - Requires Vite dev server restart
   - Check environment variable loading in `config.ts`
   </details>

## 📚 Additional Documentation

- **[Performance Optimization](PERFORMANCE_OPTIMIZATION.md)** - System optimization tips
- **[Improvements](IMPROVEMENTS.md)** - Planned features and enhancements

## 🔍 Chat System Features

### Current Implementation (localStorage)

- ✅ User-specific chat storage based on JWT token
- ✅ Automatic message reload on account switch
- ✅ Multi-tab support (1s sync interval)
- ✅ Logout clears user data
- ✅ Debug function: `debugChatStorage()` in DevTools console

### Quick Test

```javascript
// In DevTools Console (F12)
debugChatStorage(); // Shows: token, storage keys, message counts
```

### Best Practices

- Keep `videos_test` in `Backend/app/` directory
- Monitor system resources during video processing
- Use appropriate hardware acceleration (CPU/GPU) based on needs
- Regular cleanup of processed video data
