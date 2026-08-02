import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Gestión/Administración' in line or 'Comisión Administración' in line or 'AUTO-ADMIN' in line:
        print(f'{idx+1}: {line.strip()[:100]}')
