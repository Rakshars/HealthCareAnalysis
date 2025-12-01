# 🚀 Quick Start Guide

## Start Everything at Once
```bash
./start_system.sh
```

## Manual Start (Alternative)

### 1. Backend
```bash
cd health-backend-java/health-backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 2. Frontend  
```bash
cd FrontEnd
npm run dev
```

## Access Points
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **AI**: Gemini-Powered (automatic)

## Test Upload
1. Go to http://localhost:5173
2. Click "Upload" in sidebar
3. Upload any CSV with columns: `date,heart_rate,steps,sleep_hours,water_liters`
4. See real-time Gemini AI insights!

## Sample Data
Use: `/home/aurko/Downloads/health_tracking_30days.csv`