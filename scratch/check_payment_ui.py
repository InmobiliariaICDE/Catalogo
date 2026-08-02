import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'status' in line and ('select' in line.lower() or 'onchange' in line.lower() or 'modal' in line.lower()):
        if any(kw in line for kw in ['pay.status', 'm.status', 'pago', 'Payment']):
            print(f'{idx+1}: {line.strip()[:100]}')
