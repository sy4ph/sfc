
import urllib.request
import json
import sys

BASE_URL = "http://localhost:5000/api"

def check_health():
    print("--- Checking Health ---")
    try:
        with urllib.request.urlopen(f"{BASE_URL}/health") as response:
            data = json.load(response)
            print(f"Status: {response.status}")
            print(json.dumps(data, indent=2))
            return data
    except Exception as e:
        print(f"Health check failed: {e}")
        return None

def check_calculation():
    print("\n--- Checking Calculation (HMF) ---")
    url = f"{BASE_URL}/calculate"
    payload = {
        "item": "Desc_ModularFrameHeavy_C",
        "amount": 10,
        "optimization_strategy": "balanced_production"
    }
    
    try:
        req = urllib.request.Request(url)
        req.add_header('Content-Type', 'application/json')
        jsondata = json.dumps(payload).encode('utf-8')
        req.add_header('Content-Length', len(jsondata))
        
        with urllib.request.urlopen(req, jsondata) as response:
            data = json.load(response)
            summary = data.get('summary', {})
            total_power = summary.get('total_power')
            print(f"Total Power: {total_power}")
            # print(json.dumps(summary, indent=2))
    except Exception as e:
        print(f"Calculation check failed: {e}")

if __name__ == "__main__":
    check_health()
    check_calculation()
