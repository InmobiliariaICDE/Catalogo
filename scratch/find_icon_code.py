import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if any(k in line for k in ['start_date', 'increase_notes', 'renova', 'contrato', 'renderMatrix', 'getIcon', 'cellContent']):
        sys.stdout.buffer.write(f"Line {i+1}: {line.strip()[:140]}\n".encode('utf-8'))
