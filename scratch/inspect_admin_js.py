with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print(f"Total lines in admin.html: {len(lines)}")

# Print lines 5200 to 5850 safely
for i in range(5200, min(5850, len(lines))):
    l = lines[i].rstrip()
    if any(fn in l for fn in ['function normalizarPropiedades', 'async function cargarProps', 'function renderPropsGrid', 'function renderNuevo']):
        print(f"\n--- Line {i+1}: {l[:100]} ---")
