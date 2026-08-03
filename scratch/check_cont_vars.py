import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

# Check definitions of variables and functions
vars_to_check = [
    'CONT_SCRIPT_URL',
    'CONT_MESES_FULL',
    'contActiveTab',
    'contAnoFiltro',
    'contMesFiltro',
    'contRenderHero',
    'contRenderMetas',
    'contRenderTabContent',
    'contCargarDatos'
]

for var in vars_to_check:
    matches = [m.start() for m in re.finditer(r'\b' + var + r'\b', html)]
    print(f"=== {var} (found {len(matches)} times) ===")
    if len(matches) > 0:
        first = matches[0]
        print("First reference at:", first)
        print(html[max(0, first-50):min(len(html), first+150)])
    else:
        print("NOT FOUND!")
    print()
