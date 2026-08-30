with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print("Searching admin.html...")
for idx, l in enumerate(lines):
    if '★' in l or 'star' in l.lower() or 'renova' in l.lower() or 'duracion' in l.lower() or 'start_date' in l.lower() or 'aumento' in l.lower() or 'meses' in l.lower():
        if any(k in l.lower() for k in ['class=', 'function', 'const ', 'let ', 'var ', 'render', 'btn', 'status', 'icon']):
            print(f"L{idx+1}: {l.strip()[:140]}")
