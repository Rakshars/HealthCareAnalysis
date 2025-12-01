import os
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini client with API key"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("Gemini API key not found. Set GEMINI_API_KEY environment variable or pass api_key parameter.")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_response(self, prompt: str) -> str:
        """Generate response using Gemini API"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def is_configured(self) -> bool:
        """Check if API key is configured"""
        return bool(self.api_key)