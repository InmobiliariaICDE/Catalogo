import requests
import json

url = "https://script.google.com/macros/s/AKfycbwwqVgccbr31wYkGYrE71SeHEuB2DladyiZSOwUN8YjYKB9M-ZztK7xjOthiyYV3dbq6w/exec?action=getAdminData"
print("Fetching from:", url)
try:
    res = requests.get(url, timeout=15)
    print("Status code:", res.status_code)
    try:
        data = res.json()
        print("Properties count:", len(data.get("properties", [])))
        if "error" in data:
            print("Error from Apps Script:", data["error"])
        elif data.get("properties"):
            print("First property JSON:")
            print(json.dumps(data["properties"][0], indent=2))
            if "debug_raw_row_and_headers" in data:
                print("\nDebug Raw Row and Headers:")
                print(json.dumps(data["debug_raw_row_and_headers"], indent=2))
        else:
            print("No properties found.")
    except Exception as e:
        print("Failed to parse JSON:", str(e))
        print("Response text:", res.text[:500])
except Exception as e:
    print("Request failed:", str(e))
