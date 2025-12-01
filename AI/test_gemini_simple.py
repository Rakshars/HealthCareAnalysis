#!/usr/bin/env python3
import pandas as pd
from llm_insight_generator import LLMInsightGenerator

# Create simple test data
sleep_data = pd.DataFrame({
    'date': pd.date_range('2024-01-01', periods=7),
    'duration_hours': [6.2, 5.8, 7.1, 6.5, 5.5, 6.8, 7.2]
})

hr_data = pd.DataFrame({
    'date': pd.date_range('2024-01-01', periods=7),
    'heart_rate': [72, 85, 78, 95, 82, 88, 76]
})

# Test Gemini integration
print("Testing Gemini AI Integration...")
print("=" * 40)

# Initialize with API key
llm_gen = LLMInsightGenerator("AIzaSyCcXki2jCJYzcn9riKCOTfphA25FByOKb8")

# Test sleep analysis
print("\n🛌 Sleep Analysis:")
sleep_insight = llm_gen.generate_sleep_insight(sleep_data)
print(sleep_insight)

print("\n💓 Heart Rate Analysis:")
hr_insight = llm_gen.generate_heart_rate_insight(hr_data)
print(hr_insight)

print("\n💡 Lifestyle Recommendations:")
recommendations = llm_gen.generate_lifestyle_recommendations([sleep_insight, hr_insight])
for i, rec in enumerate(recommendations, 1):
    print(f"{i}. {rec}")

print("\n✅ Gemini AI integration working!")