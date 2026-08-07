import re

with open('mapa.html', 'r', encoding='utf-8') as f:
    text = f.read()

urls = set(re.findall(r'https?://[^\s\"\'\>]+', text))
for u in sorted(urls):
    if any(k in u.lower() for k in ['imgur', 'logo', 'png', 'webp', 'jpg']):
        print(u)
