from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
import csv
import io
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
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(csv_reader)
        
        # Generate ID
        data_id = str(uuid.uuid4())
        
        # Process data
        summary = {"total_users": 1}
        
        if rows:
            # Calculate averages if columns exist
            heart_rates = [float(row.get('heart_rate', 0)) for row in rows if row.get('heart_rate')]
            sleep_hours = [float(row.get('sleep_hours', 0)) for row in rows if row.get('sleep_hours')]
            steps = [float(row.get('steps', 0)) for row in rows if row.get('steps')]
            water = [float(row.get('water_liters', 0)) for row in rows if row.get('water_liters')]
            
            if heart_rates:
                summary["heart_rate_avg_7d"] = sum(heart_rates) / len(heart_rates)
            if sleep_hours:
                summary["sleep_avg_7d"] = sum(sleep_hours) / len(sleep_hours)
            if steps:
                summary["steps_avg_7d"] = sum(steps) / len(steps)
            if water:
                summary["water_avg_7d"] = sum(water) / len(water)
        
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