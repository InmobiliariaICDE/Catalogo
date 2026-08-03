import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

funcs = [
    'renderContabilidad',
    'contRenderHero',
    'contRenderMetas',
    'contRenderTabContent',
    'contCargarDatos',
    'contGetFiltrado',
    'contSumTipo',
    'contFmt'
]

for fn in funcs:
    matches = [m.start() for m in re.finditer(r'function\s+' + fn, html)]
    print(f"function {fn}: found {len(matches)} definitions")
    for pos in matches:
        print(f"  Position: {pos}")
        print("  " + repr(html[pos:pos+100]))
