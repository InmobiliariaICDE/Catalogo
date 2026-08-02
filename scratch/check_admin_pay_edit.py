import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'cambiarEstadoPago' in line or 'guardarEstadoPago' in line or 'editarPago' in line or 'adminModificarPago' in line:
        print(f'{idx+1}: {line.strip()[:120]}')
