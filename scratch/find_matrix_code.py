with open('admin.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'isRenovMonth' in line or 'renderMatrizPagos' in line:
        print(f"Line {i+1}: {line.strip()}")
