import pandas as pd
import os
from datetime import datetime, timedelta
from ai_reasoning_engine import AIReasoningEngine
from llm_insight_generator import EnhancedAIReasoningEngine

def create_sample_data():
    """Generate sample health data for testing"""
    dates = [datetime.now() - timedelta(days=i) for i in range(10, 0, -1)]
    
    # Sample sleep data
    sleep_data = pd.DataFrame({
        'date': dates,
        'duration_hours': [6.5, 7.2, 5.8, 6.0, 7.5, 8.1, 6.2, 7.0, 5.5, 6.8],
        'bedtime': ['23:30', '22:45', '00:15', '23:50', '22:30', '22:00', '23:45', '22:30', '00:30', '23:15']
    })
    
    # Sample heart rate data
    hr_data = pd.DataFrame({
        'timestamp': [datetime.now() - timedelta(days=i, hours=h) for i in range(5) for h in [9, 15, 19]],
        'heart_rate': [72, 85, 78, 70, 95, 82, 68, 88, 76, 74, 110, 85, 69, 92, 79]
    })
    
    # Sample hydration data
    hydration_data = pd.DataFrame({
        'date': dates,
        'water_ml': [1800, 2200, 1500, 1600, 2100, 2400, 1700, 2000, 1400, 1900]
    })
    
    return {
        'sleep': sleep_data,
        'heart_rate': hr_data,
        'hydration': hydration_data
    }

def main():
    print("🤖 AI Health Analysis Report (Gemini-Powered)")
    print("=" * 50)
    
    # Check for Gemini API key
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        print("✅ Gemini API key found - using Gemini AI")
        ai_engine = EnhancedAIReasoningEngine(gemini_key)
        use_gemini = True
    else:
        print("⚠️ No Gemini API key found - using traditional analysis")
        print("   Set GEMINI_API_KEY environment variable to use Gemini AI")
        ai_engine = AIReasoningEngine()
        use_gemini = False
    
    # Create sample data
    health_data = create_sample_data()
    print(f"📊 Analyzing {len(health_data)} health data types...\n")
    
    if use_gemini:
        # Use Gemini-powered analysis
        results = ai_engine.analyze_with_llm(health_data)
        
        print("🧠 Gemini AI Insights:")
        for i, insight in enumerate(results['insights'], 1):
            print(f"{i}. {insight}")
        
        print("\n💡 AI Recommendations:")
        for i, rec in enumerate(results['recommendations'], 1):
            print(f"{i}. {rec}")
        
        print(f"\n🔬 Analysis Type: {results['analysis_type']}")
        print(f"📅 Context Period: {results['context_period']}")
    else:
        # Use traditional analysis
        results = ai_engine.analyze_health_data(health_data)
        
        print(f"📅 Analysis Period: {results['context_period']}")
        print(f"🕒 Generated: {results['analysis_date'][:19]}")
        print()
        
        print("📊 Health Insights:")
        for insight in results['insights']:
            severity_emoji = {'good': '✅', 'warning': '⚠️', 'caution': '🔶', 'info': 'ℹ️'}
            emoji = severity_emoji.get(insight['severity'], '📋')
            print(f"{emoji} {insight['message']}")
        
        print("\n💡 Recommendations:")
        for rec in results['recommendations']:
            print(f"• {rec}")
    
    print("\n" + "="*50)
    if gemini_key:
        print("🚀 Powered by Google Gemini AI")
    else:
        print("💻 Using traditional rule-based analysis")

if __name__ == "__main__":
    main()