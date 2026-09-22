import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

onedrive_base = r"C:\Users\USUARIO\OneDrive"
print("Searching OneDrive directory for Lista_Inmobiliarias_y_Telefonos_ICDE.xlsx...")
for root, dirs, files in os.walk(onedrive_base):
    for f in files:
        if 'lista' in f.lower() or 'inmobiliaria' in f.lower():
            fp = os.path.join(root, f)
            print(f"Found: {fp} (size: {os.path.getsize(fp)}, mtime: {os.path.getmtime(fp)})")
