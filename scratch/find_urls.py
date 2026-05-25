import os
import re

pattern = re.compile(r'https://script\.google\.com/macros/s/[a-zA-Z0-9_-]+/exec')

found_urls = {}

for root, dirs, files in os.walk('.'):
    # skip .git, temp folders
    if any(p in root for p in ['.git', 'temp_real_kmz', 'temp_kmz', 'temp_full_kmz']):
        continue
    for file in files:
        if file.endswith(('.html', '.js', '.py', '.json', '.txt', '.md')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = pattern.findall(content)
                    if matches:
                        found_urls[path] = list(set(matches))
            except Exception as e:
                pass

print("Search results:")
for path, urls in found_urls.items():
    print(f"\nFile: {path}")
    for url in urls:
        print(f"  {url}")
