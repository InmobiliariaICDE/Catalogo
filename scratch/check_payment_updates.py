import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'status' in line and ('PAID' in line or 'registrarPago' in line or 'pago' in line.lower()):
        if any(kw in line for kw in ['status =', 'status:', '.status =', 'status: ']):
            print(f'{idx+1}: {line.strip()[:100]}')
