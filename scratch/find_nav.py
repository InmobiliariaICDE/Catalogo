import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'renderContabilidad' in line or 'contabilidad' in line.lower():
        if any(kw in line for kw in ['onclick', 'function', 'showTab', 'switchTab', 'nav', 'tab']):
            print(f'{idx+1}: {line.strip()[:120]}')
