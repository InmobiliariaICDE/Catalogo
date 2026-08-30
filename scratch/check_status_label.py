import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'getStatusLabel' in l:
        sys.stdout.buffer.write(f"Line {i+1}: {l.strip()}\n".encode('utf-8'))
