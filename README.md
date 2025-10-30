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

### Database Migrations (Alembic)

The project uses Alembic for database schema management:

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Create new migration after model changes
alembic revision --autogenerate -m "Description"

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history
```

**Required dependencies (already in requirements):**

- `alembic==1.17.0` - Migration tool
- `psycopg2-binary==2.9.11` - PostgreSQL driver

**Documentation:** See `backend/ALEMBIC_README.md` for detailed guide.

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

### 📖 Interactive API Documentation (Swagger UI)

The API provides interactive documentation through Swagger UI and ReDoc:

**Swagger UI (Interactive Testing):**

```
http://localhost:8000/docs
```

**ReDoc (Clean Documentation):**

```
http://localhost:8000/redoc
```

**OpenAPI JSON:**

```
http://localhost:8000/openapi.json
```

### 📊 API Structure Overview

```
Smart Transportation System API v1.0.0
├── 🔐 Authentication
│   ├── POST /api/v1/register
│   ├── POST /api/v1/login
│   ├── GET /api/v1/me
│   └── PUT /api/v1/me
│
├── 👤 User Management
│   ├── PUT /api/v1/users/password
│   └── PUT /api/v1/users/profile
│
├── 📹 Traffic Monitoring
│   ├── GET /api/v1/roads_name
│   ├── GET /api/v1/info/{road_name}
│   ├── GET /api/v1/frames/{road_name}
│   ├── WS /ws/frames/{road_name}
│   └── WS /ws/info/{road_name}
│
├── 🤖 AI Chatbot
│   ├── POST /api/v1/chat
│   └── WS /ws/chat
│
└── 🔧 Admin Tools
    └── GET /api/v1/admin/resources
```

### 🔐 Using Authentication in Swagger UI

1. Register/Login via `/api/v1/register` or `/api/v1/login`
2. Copy the `access_token` from the response
3. Click the **"Authorize"** button (🔒 icon at top right)
4. Enter: `Bearer <your_access_token>`
5. Click "Authorize" - Now all protected endpoints will include your token!

> **⚠️ Important:** All endpoints (except `/api/v1/register` and `/api/v1/login`) require JWT authentication. Include header: `Authorization: Bearer <access_token>`

### 🔌 WebSocket Client Examples

WebSocket endpoints cannot be tested directly in Swagger UI. Use WebSocket clients:

#### Browser JavaScript

```javascript
// Stream video frames
const ws = new WebSocket("ws://localhost:8000/ws/frames/Văn Quán");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.frame = base64 encoded JPEG
  document.getElementById("img").src = `data:image/jpeg;base64,${data.frame}`;
};

// Stream traffic info
const wsInfo = new WebSocket("ws://localhost:8000/ws/info/Văn Quán");
wsInfo.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Traffic data:", data);
  // { count_car: 10, count_motor: 5, speed_car: 45.2, speed_motor: 30.1 }
};

// AI Chat
const wsChat = new WebSocket("ws://localhost:8000/ws/chat");
wsChat.onopen = () => {
  wsChat.send(JSON.stringify({ message: "Xin chào!" }));
};
wsChat.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log("AI:", response.message);
  console.log("Images:", response.image); // Array of image URLs
};
```

#### Python Client

```python
import websocket
import json

# Connect to chat
ws = websocket.create_connection("ws://localhost:8000/ws/chat")

# Send message
ws.send(json.dumps({"message": "Cho tôi biết tình hình giao thông"}))

# Receive response
response = json.loads(ws.recv())
print("AI:", response['message'])
print("Images:", response['image'])

ws.close()
```

### 📦 Request/Response Examples

#### POST /api/v1/login

**Request:**

```json
{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "0123456789",
    "role_id": 1
  }
}
```

#### GET /api/v1/info/Văn Quán

**Headers:**

```
Authorization: Bearer <your_token>
```

**Response (200 OK):**

```json
{
  "count_car": 15,
  "count_motor": 8,
  "speed_car": 42.5,
  "speed_motor": 28.3
}
```

#### POST /api/v1/chat

**Request:**

```json
{
  "message": "Tình hình giao thông Văn Quán hiện tại thế nào?"
}
```

**Response (200 OK):**

```json
{
  "message": "Hiện tại đường Văn Quán đang thông thoáng với 15 xe ô tô và 8 xe máy. Tốc độ trung bình xe ô tô là 42.5 km/h.",
  "image": ["http://localhost:8000/api/v1/frames/Văn%20Quán"]
}
```

### 💻 cURL Examples

```bash
# Get list of roads
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/roads_name

# Get traffic info for specific road
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/info/Nguyễn%20Trãi

# Get latest frame (JPEG)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/frames/Nguyễn%20Trãi \
  --output frame.jpg

# Chat with AI
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Traffic on Nguyen Trai?"}'
```

---

## 📚 Additional Documentation & Resources

### Backend Documentation

- **[Alembic Migrations](backend/ALEMBIC_README.md)** - Database migration guide
- **[Swagger API Guide](backend/SWAGGER_README.md)** - Detailed API documentation
- **[Setup Complete](backend/SETUP_COMPLETE.md)** - Backend setup checklist

### Project Documentation

- **[Performance Optimization](PERFORMANCE_OPTIMIZATION.md)** - System optimization tips
- **[Improvements](IMPROVEMENTS.md)** - Planned features and enhancements

### Quick Reference

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

---

## � Development Tips

### Chat System Features

- **Storage:** User-specific chat history via localStorage (JWT token-based)
- **Multi-tab sync:** Automatic synchronization every 1 second
- **Account switching:** Auto-reload messages on login/logout
- **Debug tool:** Run `debugChatStorage()` in browser console (F12)

### Best Practices

- Keep test videos in `backend/app/videos_test/` directory
- Monitor system resources during video processing (use `/api/v1/admin/resources`)
- Choose appropriate hardware acceleration (CPU/GPU) based on deployment needs
- Apply database migrations after model changes: `alembic upgrade head`
- Use Swagger UI (`/docs`) for API testing and exploration
- Regular cleanup of processed video data

### Troubleshooting

**Common Issues:**

1. **API 404 Errors** - Ensure you're using `/api/v1/` prefix for all endpoints
2. **Authentication Errors** - Verify JWT token in `Authorization: Bearer <token>` header
3. **CORS Issues** - Configure `allow_origins` in `main.py` for production
4. **Port Conflicts** - Check that ports 8000 (backend) and 5173 (frontend) are available
5. **Database Errors** - Run `alembic upgrade head` to apply pending migrations

