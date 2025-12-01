import json
import uuid

def handler(request):
    if request.method == 'POST':
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
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response)
        }
    
    return {
        'statusCode': 405,
        'body': 'Method not allowed'
    }