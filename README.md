# 📺 DEMO

![Dashboard Demo](https://s3.ezgif.com/tmp/ezgif-3cb579674a790e.gif)
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
- Python
- OpenCV, YOLO (custom-trained)
- Deep Learning & Tracking (Bytetrack)
- FastAPI (for local API)
- Multithreading (for handling multiple video streams)
- Gemini API (for chatbot conversation)
- Langchain Platform (for building the LLM-driven chatbot)
- LM Studio (optional for local LLM testing)

## ⚙️ System Design
### A. Video Tracking and Traffic Analysis
- Each video stream is assigned to a dedicated processing thread (1 video = 1 worker).
- YOLO + Bytetrack are used to detect and track vehicles.
- Extracted metrics: vehicle count, average speed (for cars & motorbikes).
- Processed results are stored in a shared variable with proper thread synchronization.

### B. API Layer
- Built with FastAPI.
- Returns the latest traffic data in JSON format:
```json
{
  "road_name": {
    "frame": "<base64-encoded image>",
    "count_car": <avg number of cars>,
    "count_motor": <avg number of motorbikes>,
    "speed_car": <avg speed of cars>,
    "speed_motor": <avg speed of motorbikes>
  }
}
```

### C. Client Visualization
- Web frontend continuously fetches API data.
- Displays traffic metrics and video frame in real-time.

### D. Chatbot Query Interface (Planned)
- Uses Gemini API and Langchain Platform.
- Allows users to ask questions like: "How is traffic on Nguyen Trai street?"
- Responds based on the latest processed data.

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
```bash
pip install -r requirements_gpu.txt
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


