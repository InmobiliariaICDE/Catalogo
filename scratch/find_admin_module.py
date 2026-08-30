import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
matches = []
for idx, line in enumerate(lines):
    if any(k in line.lower() for k in ['administración de inmuebles', 'inmuebles administrados', 'edificio silvia', 'recaudado / canon', 'renderadmin', 'renderpropiedadesadmin', 'adminprops', 'propiedades-grid', 'admin-grid']):
        matches.append((idx + 1, line.strip()[:140]))

print(f"Total matches found: {len(matches)}")
for m in matches:
    sys.stdout.buffer.write(f"Line {m[0]}: {m[1]}\n".encode('utf-8'))
