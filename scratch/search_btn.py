with open('../admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Guardar y Enviar' in line or 'guardarLead' in line:
        s = f"{idx+1}: {line.strip()}"
        print(s.encode('ascii', errors='replace').decode('ascii'))
