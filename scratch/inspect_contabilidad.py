import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

pos = html.find('async function renderContabilidad()')
pos_end = html.find('function contCambiarAno', pos)
print("=== renderContabilidad code ===")
print(html[pos:pos_end])
