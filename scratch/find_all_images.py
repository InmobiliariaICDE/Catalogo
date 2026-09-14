import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.ico', '.svg', '.gif')):
            rel = os.path.relpath(os.path.join(root, file), '.')
            print(rel)
