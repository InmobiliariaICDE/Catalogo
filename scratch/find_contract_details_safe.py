with open('admin.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Detalles del Contrato' in line:
        print(f"Line {i+1}: {line.encode('ascii', 'replace').decode('ascii')}")
