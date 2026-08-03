import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if '.replace(/"/g' in line or ".replace(/\"/g" in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
