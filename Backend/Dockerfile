# Backend Dockerfile for FastAPI
FROM python:3.11   

# Nhận biến ARG để xác định dùng GPU hay CPU
ARG DEVICE=cpu

# Chỉ định thư mục làm việc
WORKDIR /app

# Cài dependency hệ thống cần cho OpenCV & hiển thị ảnh
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    git\
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements_cpu.txt requirements_gpu.txt ./

# Nâng pip
RUN pip install --upgrade pip

# Cài requirements phù hợp theo DEVICE
RUN if [ "$DEVICE" = "gpu" ]; then \
        pip install --no-cache-dir -r requirements_gpu.txt; \
    else \
        pip install --no-cache-dir -r requirements_cpu.txt; \
    fi

# Copy toàn bộ source code vào container
COPY . .

# Mở port cho FastAPI
EXPOSE 8000

# Run FastAPI bằng uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# docker build -t myapp-cpu --build-arg DEVICE=cpu .
