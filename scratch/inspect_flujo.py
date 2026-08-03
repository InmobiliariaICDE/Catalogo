import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

pos = html.find('function contRenderFlujo')
print("=== contRenderFlujo ===")
print(html[pos:pos+3000])
