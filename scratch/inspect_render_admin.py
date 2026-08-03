import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

pos = html.find('function renderAdministracion()')
print("renderAdministracion at:", pos)
print(html[pos:pos+2500])
