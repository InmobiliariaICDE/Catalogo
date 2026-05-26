import json
import urllib.request
import urllib.parse

APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-HipJ53KIf2JD1q9BUIBFUB45o4wRYcjvlqUbpg9TDAGK0q3hNQcSrV23dMCWaTgXcQ/exec"

def main():
    payload = {
        "action": "batchSaveCoords",
        "coords": [{"codigo": "479", "lat": 2.9110379, "lng": -75.2626232}]
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        APPS_SCRIPT_URL,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    
    print("Sending request...")
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            print("Status:", response.status)
            print("Headers:", response.headers)
            content = response.read().decode("utf-8")
            print("Content length:", len(content))
            print("Content snippet:", content[:500])
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    main()
