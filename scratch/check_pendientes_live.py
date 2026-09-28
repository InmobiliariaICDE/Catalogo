import urllib.request
import json
import re

with open(r'c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

urls = re.findall(r'CRM_SCRIPT_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text)
if not urls:
    urls = re.findall(r'https://script\.google\.com/macros/s/[a-zA-Z0-9_-]+/exec', text)

print("Found URLs:", urls)

if urls:
    url = urls[0] + '?action=getPendientes'
    print(f"Fetching {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            print("Response length:", len(data))
            parsed = json.loads(data)
            print("Parsed count:", len(parsed) if isinstance(parsed, list) else parsed)
            if isinstance(parsed, list):
                for p in parsed[:10]:
                    print(" - ", p.get('id'), "|", p.get('texto'), "| completada:", p.get('completada'))
    except Exception as e:
        print("Error fetching:", e)
