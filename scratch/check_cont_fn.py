import re, json

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract script blocks
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
cont_script = ""
for s in scripts:
    if 'renderContabilidad' in s:
        cont_script = s
        break

print("Extracted Contabilidad script length:", len(cont_script))

# Test JS functions in python simulation using JS engine (python exec with string checks or js2py if available)
with open('admin_data.json', 'r', encoding='utf-8') as f:
    admin_data = json.load(f)

# Let's inspect contGetParaAno implementation in html:
match = re.search(r'function contGetParaAno\(year\)\s*\{(.*?)\n\}', cont_script, re.DOTALL)
if match:
    print("--- contGetParaAno code ---")
    print(match.group(0))
