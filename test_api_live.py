
import urllib.request
import json

url = "http://localhost:5000/api/calculate"
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
    
    response = urllib.request.urlopen(req, jsondata)
    data = json.load(response)
    
    print(f"Status: {response.status}")
    print(f"Full Response: {json.dumps(data, indent=2)}")
    
except Exception as e:
    print(f"Request failed: {e}")
