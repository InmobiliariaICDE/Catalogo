import urllib.request
import json

key = "AIzaSyAoYzFQOKQGq_yPBo6KnrWeFYPqs6zNr5c"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode("utf-8"))
        print("Available models:")
        for m in data.get("models", []):
            name = m.get("name")
            display_name = m.get("displayName")
            print(f"- {name} ({display_name})")
except Exception as e:
    print("Error listing models:", str(e))
