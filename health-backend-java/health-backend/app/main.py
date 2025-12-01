from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uuid
import sys
import os
from typing import Dict
from .processor import get_trends_and_insights
from .models import UploadResponse, SummaryResponse

# Add AI module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../AI'))
from llm_insight_generator import EnhancedAIReasoningEngine

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

# Initialize AI engine with Gemini
GEMINI_API_KEY = "AIzaSyCcXki2jCJYzcn9riKCOTfphA25FByOKb8"
ai_engine = EnhancedAIReasoningEngine(GEMINI_API_KEY)

@app.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    try:
        # Read CSV
        df = pd.read_csv(file.file)
        
        # Process
        results = get_trends_and_insights(df)
        
        # Generate ID and store
        data_id = str(uuid.uuid4())
        
        # Extract user_id if possible, else default
        user_id = "unknown"
        if 'user_id' in df.columns:
            user_id = str(df['user_id'].iloc[0])
            
        stored_data = {
            "user_id": user_id,
            "raw_filename": file.filename,
            "processed": results
        }
        DATA_STORE[data_id] = stored_data
        
        # Generate AI insights
        try:
            # Prepare data for AI analysis
            health_data = {}
            if 'sleep_hours' in df.columns:
                sleep_df = df[['date', 'sleep_hours']].copy()
                sleep_df['duration_hours'] = sleep_df['sleep_hours']
                health_data['sleep'] = sleep_df
            if 'heart_rate' in df.columns:
                hr_df = df[['date', 'heart_rate']].copy()
                health_data['heart_rate'] = hr_df
            if 'water_liters' in df.columns:
                water_df = df[['date', 'water_liters']].copy()
                water_df['hydration'] = water_df['water_liters']
                health_data['hydration'] = water_df
            
            # Get AI insights
            ai_insights = ai_engine.analyze_with_llm(health_data)
            results["ai_insights"] = ai_insights
        except Exception as e:
            print(f"AI analysis failed: {e}")
            results["ai_insights"] = {"insights": [], "recommendations": []}
        
        return {
            "status": "ok",
            "data_id": data_id,
            "summary": results["summary"],
            "ai_insights": results.get("ai_insights", {})
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/data/{data_id}/summary")
async def get_summary(data_id: str):
    if data_id not in DATA_STORE:
        raise HTTPException(status_code=404, detail="Data ID not found")
    
    data = DATA_STORE[data_id]
    processed = data["processed"]
    
    return {
        "user_id": data["user_id"],
        "summary": processed["summary"],
        "trends": processed["trends"],
        "anomalies": processed["anomalies"],
        "timeseries": processed["timeseries"],
        "data_id": data_id
    }

@app.get("/data/{data_id}/trends")
async def get_trends(data_id: str):
    if data_id not in DATA_STORE:
        raise HTTPException(status_code=404, detail="Data ID not found")
        
    return DATA_STORE[data_id]["processed"]["timeseries"]

@app.get("/data/{data_id}/anomalies")
async def get_anomalies(data_id: str):
    if data_id not in DATA_STORE:
        raise HTTPException(status_code=404, detail="Data ID not found")
        
    return DATA_STORE[data_id]["processed"]["anomalies"]

@app.get("/health")
async def health_check():
    return {"status": "ok"}
