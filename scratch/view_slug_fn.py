with open('../admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'function generarSlugPropiedad' in line:
        for i in range(idx, idx+15):
            print(f"{i+1}: {lines[i].strip()}")
