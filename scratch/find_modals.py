import re, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

matches = re.findall(r'id=["\'][^"\']*modal[^"\']*["\']', content, re.IGNORECASE)
for m in sorted(list(set(matches))):
    print(m)
