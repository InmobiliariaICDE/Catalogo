import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

lines = html.splitlines()

for i, line in enumerate(lines):
    if '<script' in line:
        print(f"Line {i+1}: {line[:120]}")
