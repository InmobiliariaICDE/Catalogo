import urllib.request
import json

key = "AIzaSyBeCa0rPdvPziSwRTXV1SUvJ06UnpXfgmE"

def test_model(model):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps({
        "contents": [{"parts": [{"text": "Dí hola en una palabra"}]}]
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print(f"--- {model} SUCCESS ---")
            print(res_body[:300])
    except Exception as e:
        print(f"--- {model} ERROR ---")
        if hasattr(e, 'read'):
            print(e.read().decode("utf-8"))
        else:
            print(str(e))

test_model("gemini-flash-latest")
