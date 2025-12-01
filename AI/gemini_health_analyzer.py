#!/usr/bin/env python3
"""
Gemini-powered Health Data Analyzer
Usage: python gemini_health_analyzer.py --api-key YOUR_API_KEY --data-file health_data.csv
"""

import argparse
import pandas as pd
from llm_insight_generator import EnhancedAIReasoningEngine
import json

def main():
    parser = argparse.ArgumentParser(description='Analyze health data using Gemini AI')
    parser.add_argument('--api-key', required=True, help='Gemini API key')
    parser.add_argument('--data-file', required=True, help='Path to CSV health data file')
    
    args = parser.parse_args()
    
    # Load health data
    try:
        df = pd.read_csv(args.data_file)
        print(f"Loaded {len(df)} records from {args.data_file}")
    except Exception as e:
        print(f"Error loading data: {e}")
        return
    
    # Initialize AI engine with Gemini API key
    ai_engine = EnhancedAIReasoningEngine(gemini_api_key=args.api_key)
    
    # Check if data is in wide format (columns) or long format (rows)
    if 'metric' in df.columns:
        # Long format - group by metric
        health_data = {}
        for metric in df['metric'].unique():
            metric_df = df[df['metric'] == metric].copy()
            if metric == 'sleep':
                metric_df['duration_hours'] = metric_df['value']
            elif metric == 'heart_rate':
                metric_df['heart_rate'] = metric_df['value']
            elif metric == 'water':
                metric_df['hydration'] = metric_df['value']
            health_data[metric] = metric_df
    else:
        # Wide format - convert to expected format
        health_data = {}
        
        # Convert date format
        df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
        
        # Sleep data
        if 'sleep_hours' in df.columns:
            sleep_df = df[['date', 'sleep_hours']].copy()
            sleep_df['duration_hours'] = sleep_df['sleep_hours']
            health_data['sleep'] = sleep_df
        
        # Heart rate data
        if 'heart_rate' in df.columns:
            hr_df = df[['date', 'heart_rate']].copy()
            health_data['heart_rate'] = hr_df
        
        # Water/hydration data
        if 'water_liters' in df.columns:
            water_df = df[['date', 'water_liters']].copy()
            water_df['hydration'] = water_df['water_liters']
            health_data['hydration'] = water_df
    
    # Analyze with Gemini AI
    print("\nAnalyzing health data with Gemini AI...")
    print(f"Data types found: {list(health_data.keys())}")
    
    results = ai_engine.analyze_with_llm(health_data)
    
    # Display results
    print("\n" + "="*50)
    print("HEALTH INSIGHTS (Powered by Gemini AI)")
    print("="*50)
    
    if results['insights']:
        for i, insight in enumerate(results['insights'], 1):
            print(f"\n{i}. {insight}")
    else:
        print("\nNo insights generated. Checking data...")
        for data_type, df in health_data.items():
            print(f"{data_type}: {len(df)} records")
    
    print(f"\n{'='*50}")
    print("LIFESTYLE RECOMMENDATIONS")
    print("="*50)
    
    if results['recommendations']:
        for i, rec in enumerate(results['recommendations'], 1):
            print(f"\n{i}. {rec}")
    else:
        print("\nNo recommendations generated.")
    
    print(f"\nAnalysis Type: {results['analysis_type']}")
    print(f"Context Period: {results['context_period']}")

if __name__ == "__main__":
    main()