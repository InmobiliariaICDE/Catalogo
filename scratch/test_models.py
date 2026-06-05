import urllib.request
import json

api_key = "xai-Q8AGm6yQ4IMYjHGX7Wen3dxavFgmUSjJIDjwW23jVKebh2tzOAbqFecBEMlVSLeKVgdNEzKTNxL67rGe"
url = "https://api.x.ai/v1/models"
headers = {
    "Authorization": f"Bearer {api_key}",
    "User-Agent": "Mozilla/5.0"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        print("Success:")
        models = json.loads(resp.read().decode())
        print(json.dumps(models, indent=2))
except Exception as e:
    if hasattr(e, "read"):
        print("Error response:", e.read().decode())
    else:
        print("Error:", e)
