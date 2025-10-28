#!/bin/sh
set -e

# Start Telegram bot in the background
if [ -f "app/bot_tele.py" ]; then
  echo "Starting Telegram bot..."
  python -u app/bot_tele.py &
fi

# Start FastAPI (uvicorn)
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
