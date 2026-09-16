import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.js', '.css')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'miniaturas' in content:
                        print(f"FOUND IN {filepath}")
                        for line_no, line in enumerate(content.splitlines(), 1):
                            if 'miniaturas' in line:
                                print(f"  {line_no}: {line.strip()[:140]}")
            except Exception as e:
                pass
