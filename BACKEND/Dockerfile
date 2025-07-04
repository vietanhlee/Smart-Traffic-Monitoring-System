# Backend Dockerfile for FastAPI
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements_cpu.txt ./
RUN pip install --no-cache-dir -r requirements_cpu.txt

# Copy backend code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "fast_api:app", "--host", "0.0.0.0", "--reload"]
