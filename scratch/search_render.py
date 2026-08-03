import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Search for calls to renderAdministracion or renderGestion
print("=== Calls to renderAdministracion ===")
for m in re.finditer(r'renderAdministracion\(\)', html):
    idx = m.start()
    print(html[max(0, idx-100):min(len(html), idx+100)])
    print("---")

print("\n=== Calls to renderGestion ===")
for m in re.finditer(r'renderGestion\(\)', html):
    idx = m.start()
    print(html[max(0, idx-100):min(len(html), idx+100)])
    print("---")
