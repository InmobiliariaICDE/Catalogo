import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'ensureUniqueIds' in line:
        sys.stdout.buffer.write(f"Line {idx+1}: {line.strip()[:140]}\n".encode('utf-8'))
