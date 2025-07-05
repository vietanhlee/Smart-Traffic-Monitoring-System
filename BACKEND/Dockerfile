# Backend Dockerfile for FastAPI
FROM python


# Nhận biến ARG để xác định dùng GPU hay CPU
ARG DEVICE=cpu


# chỉ định thư mục làm việc để chạy lệnh
WORKDIR /app


# Copy requirements and install dependencies
# . = current directory 
# COPY ./requirements_cpu.txt ./requirements_cpu.txt 

# Copy cả hai file requirements vào container
COPY requirements_cpu.txt .
COPY requirements_gpu.txt .

# Chọn file requirements phù hợp dựa trên biến DEVICE
RUN if [ "$DEVICE" = "gpu" ]; then \
        pip install --no-cache-dir -r requirements_gpu.txt; \
    else \
        pip install --no-cache-dir -r requirements_cpu.txt; \
    fi

# Copy backend code
COPY . .
# ❗ Lưu ý: EXPOSE chỉ mang tính mô tả, không thực sự publish cổng — cần
EXPOSE 8000

CMD ["uvicorn", "fast_api:app", "--host", "0.0.0.0", "--reload"]
# --host 0.0.0.0: Cho phép truy cập từ bên ngoài container.

# docker build -t myapp-gpu --build-arg DEVICE=gpu .
