import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i in range(10815, 10830):
    sys.stdout.buffer.write(f"{i+1:5d}: {lines[i]}".encode('utf-8'))
