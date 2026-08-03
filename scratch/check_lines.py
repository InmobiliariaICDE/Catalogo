import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print("--- admin.html ---")
for idx, line in enumerate(lines):
    if 16270 <= idx <= 16520:
        if 'function contRenderInversiones' in line or 'paretoHtml' in line or 'contMostrarParetoGraficas' in line:
            print(f'{idx+1}: {line.strip()[:100]}')

with open('contabilidad_script.js', 'r', encoding='utf-8', errors='ignore') as f:
    lines2 = f.readlines()

print("--- contabilidad_script.js ---")
for idx, line in enumerate(lines2):
    if 3495 <= idx <= 3760:
        if 'function contRenderInversiones' in line or 'paretoHtml' in line or 'contMostrarParetoGraficas' in line:
            print(f'{idx+1}: {line.strip()[:100]}')
