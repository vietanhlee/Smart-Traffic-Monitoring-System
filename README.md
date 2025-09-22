# Smart Transportation System

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

![Demo](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo.png)
![Demo 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/demo2.png)
![Dashboard](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad.png)
![Dashboard 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/Dashboad2.png)
![Chatbot](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot1.png)
![Chatbot 2](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot2.png)
![Chatbot3](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/.github/chatbot3.png)

## Project Structure

```
├── app/                    # Backend FastAPI application
│   ├── api/               # API endpoints
│   ├── schemas/           # Data models and schemas
│   ├── services/          # Business logic and services
│   ├── AI models/         # AI model files and benchmarks
│   └── video_test/        # Test video files
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions
└── FRONTEND_for_testing/  # Static frontend test files
```

## Requirements

- Python 3.9 < 3.13
- Node.js 18+
- NVIDIA GPU (optional, for GPU acceleration)
- Backend dependencies: `app/requirements_cpu.txt` or `app/requirements_gpu.txt`
- Frontend dependencies: `package.json`

## Manual Setup

### Backend Setup

1. Navigate to the backend directory:

```bash
cd app
```

2. Install Python dependencies:

```bash
# For CPU-only installation
pip install -r requirements_cpu.txt

# For GPU support
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

```bash
# Create .env file for ChatBot configuration (Optional)
echo "GOOGLE_API_KEY=your_google_api_key_here" > .env
```

### Frontend Setup

1. Install Node.js dependencies:

```bash
# From project root
npm install
```

### Running the Application

1. Start the backend server:

```bash
# From app directory
uvicorn main:app --reload
# Server will be available at http://localhost:8000
```

2. Start the frontend development server:

```bash
# From project root
npm run dev
# Vite dev server will be available at http://localhost:5173
```

## Docker Deployment

### Quick Start with Docker Compose

1. Download test videos (if not already downloaded):

```bash
# Navigate to app directory where videos will be stored
cd app
```

```bash
# Install gdown tool for downloading from Google Drive
pip install gdown
```

```bash
# Download test videos (sẽ được lưu vào thư mục app/video_test)
# Danh sách video:
# - Đường Láng.mp4
# - Ngã Tư Sở.mp4
# - Nguyễn Trãi.mp4
# - Văn Phú.mp4
# - Văn Quán.mp4
gdown --folder https://drive.google.com/drive/folders/1gkac5U5jEs174p7V7VC3rCmgvO_cVwxH
```

```bash
# Return to root directory for docker-compose
cd ..
```

2. Run with Docker Compose:

```bash
# Build and start services
docker compose up --build

# Or run in background
docker compose up --build -d

# Stop services
docker compose down
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

## Configuration

### Frontend Configuration

Base URLs and API endpoints are configured in `src/config.ts` and can be customized using Vite environment variables.

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

- `GET /frames_base64/{road_name}`

  - Returns latest frame for specified road in base64 format
  - Response type: `application/json`
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

- `GET /test`

  - Check chat service status
  - Response:
    ```json
    {
      "status": "OK",
      "agent_ready": true
    }
    ```

- `POST /chat`
  - Send message to AI assistant
  - Request:
    ```json
    {
      "message": "string"
    }
    ```
  - Response:
    ```json
    {
      "message": "string",
      "image": "string | null"
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
      "image": "string | null"
    }
    ```

- `WS /chat1`
  - Advanced AI agent chatbot endpoint
  - Request format:
    ```json
    {
      "message": "string"
    }
    ```
  - Response format:
    ```json
    {
      "text": "string",
      "image": "string | null"
    }
    ```
  - Error response:
    ```json
    {
      "text": "Lỗi: <error message>",
      "image": null
    }
    ```

### Example Usage

```bash
# Get list of roads
curl http://localhost:8000/roads_name

# Get traffic info for specific road
curl http://localhost:8000/info/"Nguyễn Trãi"

# Get raw JPEG frame
curl http://localhost:8000/frames/"Nguyễn Trãi" --output frame.jpg

# Get base64 encoded frame
curl http://localhost:8000/frames_base64/"Nguyễn Trãi"

# Test chat service status
curl http://localhost:8000/test

# Send chat message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Traffic on Nguyen Trai?"}'
```

Note: For WebSocket endpoints, you'll need to use a WebSocket client or the provided React frontend components.

---

## Troubleshooting Guide

### Common Issues

1. **API Endpoint Errors**

   - 404 errors for `/veheicles` or legacy `/frames`
   - Solution: Use current endpoints (`/road_name` and WebSocket endpoints)
   - Close legacy tabs (e.g., `FRONTEND_for_testing/index.html`)
   - Hard-reload the Vite app

2. **CORS Issues**

   - Backend uses permissive CORS in development
   - For production: Configure `allow_origins` in `app/main.py`

3. **Environment Changes**
   - Requires Vite dev server restart
   - Check environment variable loading in `config.ts`

### Best Practices

- Keep test videos in `app/video_test/` directory
- Monitor system resources during video processing
- Use appropriate hardware acceleration (CPU/GPU) based on needs
- Regular cleanup of processed video data
