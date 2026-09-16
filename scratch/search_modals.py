with open('c:/Users/USUARIO/Documents/GitHub/Catalogo/admin.html', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        if 'modal-box' in line and '<div' in line:
            print(f'{idx}: {line.strip()}')
