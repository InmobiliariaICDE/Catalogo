import os, re

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    for line_no, line in enumerate(content.splitlines(), 1):
                        if 'topbar' in line or 'loginScreen' in line or ('brand' in line and '<img' in line):
                            print(f"{filepath}:{line_no}: {line.strip()[:150]}")
            except Exception as e:
                pass
