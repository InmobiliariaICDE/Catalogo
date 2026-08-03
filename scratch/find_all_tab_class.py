import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
matches = [m.start() for m in re.finditer(r'class="[^"]*\btab\b[^"]*"', html)]
print("Elements with class tab:", len(matches))
for i, pos in enumerate(matches):
    print(f"Match {i}:")
    print(html[max(0, pos-40):min(len(html), pos+120)])
    print("---")
