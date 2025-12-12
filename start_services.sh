#!/bin/bash

# Start ML Service in background
echo "Starting ML Service on port 8000..."
cd ml-modal
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &
ML_PID=$!
cd ..

# Start Backend
echo "Starting Backend on port 5000..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "Services started. Press ANY KEY to stop."
read -n 1

kill $ML_PID
kill $BACKEND_PID
echo "Services stopped."
