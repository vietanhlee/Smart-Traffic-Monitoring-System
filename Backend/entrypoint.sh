#!/bin/sh
set -e

# Change to working directory
cd /backend

# Start Telegram bot in the background
if [ -f "app/bot_tele.py" ]; then
  echo "Chạy bot telegram..."
  python -u app/bot_tele.py &
fi

# Start FastAPI (uvicorn)
echo "Bắt đầu máy chủ FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
