import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('actualizar_admin.py', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'AL_DIA' in line or 'Al' in line and 'dia' in line.lower():
        print(f'{idx+1}: {line.strip()[:100]}')
