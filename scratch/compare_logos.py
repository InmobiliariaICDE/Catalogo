import re

files = ['admin.html', 'admin_backup.html', 'adminreferenciavieja.html', 'index.html', 'crm_clean.html']

for fn in files:
    with open(fn, encoding='utf-8', errors='ignore') as f:
        text = f.read()
    print(f"=== {fn} ===")
    matches = re.findall(r'<img[^>]+>', text)
    for m in matches:
        if any(x in m for x in ['logo', 'ICDE', 'YbnRomr', 'XgfIulc', 'oQ3uUgP', 'Saludo', 'favicon']):
            print("  ", m)
