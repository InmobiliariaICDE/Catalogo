import re

with open('admin.html', encoding='utf-8') as f:
    admin_text = f.read()

with open('admin_backup.html', encoding='utf-8') as f:
    backup_text = f.read()

print("--- ADMIN.HTML IMAGES ---")
for line_no, line in enumerate(admin_text.splitlines(), 1):
    if '<img' in line or 'favicon' in line or 'icon' in line.lower() and '<link' in line:
        print(f"{line_no}: {line.strip()}")

