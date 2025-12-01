from http.server import BaseHTTPRequestHandler
import json
import uuid
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the path
        path = self.path
        
        if path == '/health' or path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {"status": "ok", "message": "Health Backend API"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/upload':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            try:
                # Generate mock response
                data_id = str(uuid.uuid4())
                summary = {
                    "total_users": 1,
                    "heart_rate_avg_7d": 75,
                    "sleep_avg_7d": 7.2,
                    "steps_avg_7d": 8500,
                    "water_avg_7d": 2.1
                }
                
                response = {
                    "status": "ok",
                    "data_id": data_id,
                    "summary": summary
                }
                
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()