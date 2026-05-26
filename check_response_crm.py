import json
import urllib.request
import urllib.parse

# Using CRM_SCRIPT_URL
CRM_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzFUuzwKA_5C35NX7S2eniREyP8AAqqYxz4rUoL195-vfIuiis8KmG3IbKIojfywllI1w/exec"

def main():
    payload = {
        "action": "batchSaveCoords",
        "coords": [{"codigo": "479", "lat": 2.9110379, "lng": -75.2626232}]
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        CRM_SCRIPT_URL,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    
    print("Sending request to CRM_SCRIPT_URL...")
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            print("Status:", response.status)
            print("Headers:", response.headers)
            content = response.read().decode("utf-8")
            print("Content snippet:", content[:500])
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    main()
