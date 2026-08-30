import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
matches = []
for idx, line in enumerate(lines):
    if any(k in line for k in ['adminData', 'icde_admin_data', 'getAdminData', 'cargarAdminData']):
        matches.append((idx + 1, line.strip()[:140]))

print(f"Total matches found: {len(matches)}")
for m in matches[:50]:
    sys.stdout.buffer.write(f"Line {m[0]}: {m[1]}\n".encode('utf-8'))
