import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.js', '.css', '.json')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'logo_premium' in content or 'favicon_dark_badge' in content:
                        print(f"FOUND IN {filepath}")
            except Exception as e:
                pass
