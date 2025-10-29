FROM python:3.11

# Nhận biến ARG để xác định dùng GPU hay CPU
ARG DEVICE=cpu

WORKDIR /backend

# Cài dependency hệ thống cần cho OpenCV & hiển thị ảnh
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    git\
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements_cpu.txt requirements_gpu.txt ./

RUN pip install --upgrade pip

# Cài requirements phù hợp theo DEVICE
RUN if [ "$DEVICE" = "gpu" ]; then \
        pip install --no-cache-dir -r requirements_gpu.txt; \
    else \
        pip install --no-cache-dir -r requirements_cpu.txt; \
    fi

COPY . .

# Entrypoint to start both Telegram bot and API server
RUN chmod +x entrypoint.sh

EXPOSE 8000

# Run FastAPI và Telegram bot
CMD ["./entrypoint.sh"]

# docker build -t myapp-cpu --build-arg DEVICE=cpu .
