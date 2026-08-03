import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
matches = [m.start() for m in re.finditer(r'\bcontMetas\b', html)]
print("contMetas matches:", len(matches))
for pos in matches[:10]:
    print(html[max(0, pos-50):min(len(html), pos+100)])
    print("---")
