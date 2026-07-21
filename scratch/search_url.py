with open('admin.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'ADMIN_SCRIPT_URL' in line:
            print(f"{i}: {line.strip()}")
