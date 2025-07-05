# 📺 DEMO

![Dashboard Demo](https://raw.githubusercontent.com/vietanhlee/Smart-Transportation-System/refs/heads/main/display_for_github/demo.png)

# Smart Transportation System

## 🚦 Overview

- This project is a Smart Transportation System designed to monitor and evaluate real-time traffic congestion in urban areas using traffic surveillance cameras. The system processes video streams, applies deep learning models for vehicle detection and tracking, and outputs key traffic metrics such as vehicle count and speed. These metrics are served via a local API and continuously streamed to a frontend interface.

- Additionally, the system aims to integrate a chatbot-based query interface that allows drivers or users to request traffic information about specific routes. The chatbot leverages language models and natural language processing to provide concise and useful responses, making the system both interactive and driver-friendly.

## 🎯 Objectives

- Monitor traffic conditions using city surveillance cameras.
- Apply object detection and tracking (e.g., YOLO with Bytetrack) to extract vehicle parameters.
- Predict traffic congestion levels based on visual data.
- Provide a simple API for querying traffic insights.
- Stream results to a frontend client for visualization.
- Support natural language queries about current traffic status through an integrated chatbot interface.

## 🧠 Technologies Used

### Backend

- Python
- OpenCV, YOLO (custom-trained)
- Deep Learning & Tracking (Bytetrack)
- FastAPI (for local API)
- Multithreading (for handling multiple video streams)
- Gemini API (for chatbot conversation)
- Langchain Platform (for building the LLM-driven chatbot)

### Frontend

- ReactJS (functional components, hooks)
- lucide-react (icon library)
- Fetch API (continuous polling, async handling)
- Pure CSS (custom UI, dynamic effects)

## ⚙️ System Design

### A. Video Tracking and Traffic Analysis

- Each video stream is assigned to a dedicated processing thread (1 video = 1 worker).
- YOLO + Bytetrack are used to detect and track vehicles.
- Extracted metrics: vehicle count, average speed (for cars & motorbikes).
- Processed results are stored in a shared variable with proper thread synchronization.

### B. API Layer

- Built with FastAPI.
- Provides 3 main endpoints:

#### 1. `/frames` (GET)

Returns the latest frame image for each road:

```json
{
  "road_name": {
    "frame": "<base64-encoded image>"
  }
}
```

#### 2. `/veheicles` (GET)

Returns vehicle information for each road:

```json
{
  "road_name": {
    "count_car": <number of cars>,
    "count_motor": <number of motorbikes>,
    "speed_car": <average speed of cars>,
    "speed_motor": <average speed of motorbikes>
  }
}
```

#### 3. `/chat` (POST)

Receives a prompt from the frontend and returns a chatbot response:

```json
{
  "message": "your prompt here"
}
```

Returns:

```json
{
  "response": "AI response"
}
```

### C. Client Visualization

- The web frontend continuously fetches `/frames` (every 200ms) and `/veheicles` (every 1s).
- Data is merged and displayed visually: camera images, vehicle counts & speeds for each road.
- Real-time UI, dynamic effects, fully responsive.

### D. Chatbot Query Interface

- Uses Gemini API and Langchain Platform.
- Users can ask: "What is the traffic like on Nguyen Trai street?"
- The chatbot responds based on the latest traffic data.

## 🧪 How to Run

### 🖥️ System Requirements

- Python >= 3.11
- Required libraries from `requirements_cpu.txt` or `requirements_gpu.txt`
- Web browser (Chrome, Edge, Firefox, etc.)
- NODEJS > 18

### 💾 Installation for FRONTEND

#### install libraries:

```bash
npm install lucide-react
```

### 💾 Installation for BACKEND

#### On CPU:

```bash
pip install -r requirements_cpu.txt
```

#### On GPU:

First, install PyTorch with CUDA support (for example, CUDA 11.8):

```bash
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

Then install the remaining dependencies:

```bash
pip install -r requirements_gpu.txt
```

#### Create `.env` file (required for Gemini API)

In the `BACKEND` directory, create a file named `.env` and add your Google API key:

```bash
GOOGLE_API_KEY=your_google_api_key_here
```

Or create `.env` manually with the following content:

```bash
GOOGLE_API_KEY=your_google_api_key_here
```

### 🚀 Launch the System

#### Run frontend:

```bash
npm start
```

#### Run backend:

```bash
cd BACKEND
```

```bash
uvicorn fast_api:app --reload
```

- API will run at: `http://127.0.0.1:8000`
