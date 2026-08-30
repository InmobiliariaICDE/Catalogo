import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx in range(11250, min(11340, len(lines))):
    sys.stdout.buffer.write(f"Line {idx+1}: {lines[idx].rstrip()}\n".encode('utf-8'))
