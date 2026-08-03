import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

lines = html.splitlines()

print("=== Checking script tags after line 14541 ===")
for idx in range(14540, len(lines)):
    line = lines[idx]
    if '<script' in line or '</script>' in line:
        print(f"Line {idx+1}: {line}")
