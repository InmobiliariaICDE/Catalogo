import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

def print_range(start, end):
    header = f"\n================ LINES {start} to {end} ================\n"
    sys.stdout.buffer.write(header.encode('utf-8'))
    for i in range(start - 1, min(end, len(lines))):
        line_str = f"{i+1:5d}: {lines[i]}"
        sys.stdout.buffer.write(line_str.encode('utf-8'))

print_range(10920, 11050)
