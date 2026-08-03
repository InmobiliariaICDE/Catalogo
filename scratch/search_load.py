import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
matches = [m.start() for m in re.finditer(r'loadAdminData', html)]
print("loadAdminData matches:", len(matches))
for pos in matches:
    print(html[max(0, pos-100):min(len(html), pos+200)])
    print("---")

print("=== Searching initial page load / showTab / default tab logic ===")
matches2 = [m.start() for m in re.finditer(r'showTab\(', html)]
for pos in matches2:
    snippet = html[max(0, pos-50):min(len(html), pos+100)]
    print(repr(snippet))
