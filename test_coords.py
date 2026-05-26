import json
import urllib.request

APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-HipJ53KIf2JD1q9BUIBFUB45o4wRYcjvlqUbpg9TDAGK0q3hNQcSrV23dMCWaTgXcQ/exec"

def main():
    payload = {
        "action": "saveCoords",
        "codigo": "479",
        "lat": 2.9110379,
        "lng": -75.2626232
    }
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        APPS_SCRIPT_URL,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_content = response.read().decode("utf-8")
            print(f"Response: {res_content}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
