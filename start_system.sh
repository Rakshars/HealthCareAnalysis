#!/bin/bash

echo "🚀 Starting Health Care Analysis System with Gemini AI"
echo "=================================================="

# Start Backend
echo "📡 Starting Backend Server..."
cd health-backend-java/health-backend
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -q fastapi uvicorn pandas numpy google-generativeai python-dotenv
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend Server..."
cd ../../FrontEnd
npm install -q
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ System Started Successfully!"
echo "📊 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:5173"
echo "🤖 AI: Gemini-Powered"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait