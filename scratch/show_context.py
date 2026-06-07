with open('c:/Users/USUARIO/Documents/GitHub/Catalogo/admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines, 1):
    if 'active-admin-row' in line:
        print(f"=== Match at line {idx} ===")
        start = max(0, idx - 6)
        end = min(len(lines), idx + 5)
        for i in range(start, end):
            print(f"{i+1}: {lines[i].strip()}")
        print("=" * 40)
