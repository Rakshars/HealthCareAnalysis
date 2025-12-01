from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uuid
import os
from typing import Dict

app = FastAPI(title="Health Data Backend", version="1.0")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
DATA_STORE: Dict[str, Dict] = {}

@app.get("/")
async def root():
    return {"message": "Health Backend API", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    try:
        # Read CSV
        df = pd.read_csv(file.file)
        
        # Generate ID and store
        data_id = str(uuid.uuid4())
        
        # Simple processing
        summary = {
            "total_users": 1,
            "records": len(df)
        }
        
        if 'heart_rate' in df.columns:
            summary["heart_rate_avg_7d"] = float(df['heart_rate'].mean())
        if 'sleep_hours' in df.columns:
            summary["sleep_avg_7d"] = float(df['sleep_hours'].mean())
        if 'steps' in df.columns:
            summary["steps_avg_7d"] = float(df['steps'].mean())
        if 'water_liters' in df.columns:
            summary["water_avg_7d"] = float(df['water_liters'].mean())
        
        stored_data = {
            "summary": summary,
            "trends": [],
            "anomalies": [],
            "timeseries": []
        }
        DATA_STORE[data_id] = stored_data
        
        return {
            "status": "ok",
            "data_id": data_id,
            "summary": summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/data/{data_id}/summary")
async def get_summary(data_id: str):
    if data_id not in DATA_STORE:
        raise HTTPException(status_code=404, detail="Data ID not found")
    
    return DATA_STORE[data_id]