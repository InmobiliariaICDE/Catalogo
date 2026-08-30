import re

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

print("Length of admin.html:", len(html))

# Search for renderPropsGrid or render function or props loading in admin.html
lines = html.splitlines()
for idx, l in enumerate(lines):
    if any(k in l for k in ['renderPropsGrid', 'function render', 'cargarProps', 'normalizarPropiedades', 'grid', 'propsContainer', 'propsGrid']):
        print(f"Line {idx+1}: {l[:150]}")
