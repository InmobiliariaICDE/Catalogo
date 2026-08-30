with open('ADMINISTRACION/dashboard_inmobiliario.html', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

print("Length of dashboard_inmobiliario.html:", len(c))
for kw in ['portal', 'nogal', 'goya', 'local 1', 'apto 203', '21']:
    for line in c.splitlines():
        if kw in line.lower():
            print(f"Match for '{kw}': {line.strip()[:150]}")
