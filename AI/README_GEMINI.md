# Gemini AI Integration for Health Data Analysis

This AI module now supports Google Gemini AI for enhanced health insights and recommendations.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Configure API Key

**Option A: Environment Variable**
```bash
export GEMINI_API_KEY="your_api_key_here"
```

**Option B: .env File**
```bash
cp .env.example .env
# Edit .env and add your API key
```

## Usage

### Basic Analysis
```bash
python sample_usage.py
```

### Command Line Tool
```bash
python gemini_health_analyzer.py --api-key YOUR_API_KEY --data-file ../sample_health_data.csv
```

### Programmatic Usage
```python
from llm_insight_generator import EnhancedAIReasoningEngine

# Initialize with API key
ai_engine = EnhancedAIReasoningEngine(gemini_api_key="your_key")

# Analyze health data
results = ai_engine.analyze_with_llm(health_data)
```

## Features

- **Sleep Analysis**: AI-powered sleep pattern insights
- **Heart Rate Monitoring**: Intelligent cardiovascular health analysis  
- **Lifestyle Recommendations**: Personalized suggestions based on data patterns
- **Fallback Support**: Works without API key using simulated responses

## API Key Security

- Never commit API keys to version control
- Use environment variables or .env files
- The system gracefully falls back to simulated responses if no key is provided

## Example Output

```
🤖 AI Health Analysis Report (Gemini-Powered)
==================================================
✅ Gemini API key found - using Gemini AI

🧠 Gemini AI Insights:
1. Your sleep duration of 6.2 hours is below the recommended 7-9 hours nightly...
2. Heart rate patterns show some elevated readings during stress periods...

💡 AI Recommendations:
1. Set a consistent bedtime routine 30 minutes before sleep
2. Practice 5-minute breathing exercises during stressful moments
3. Take short walks to naturally regulate heart rate

🔬 Analysis Type: LLM-Enhanced
📅 Context Period: Last 7 days
🚀 Powered by Google Gemini AI
```