import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('actualizar_admin.py', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

print('actualizar_admin.py length:', len(c))
print('contGetParaAno in actualizar_admin.py:', 'contGetParaAno' in c)
