import os
import sys
import glob

sys.stdout.reconfigure(encoding='utf-8')

appdata = os.environ.get('APPDATA', '')
localappdata = os.environ.get('LOCALAPPDATA', '')
temp = os.environ.get('TEMP', '')

print("Searching Excel temp / autosave directories...")

search_paths = [
    os.path.join(appdata, "Microsoft", "Excel"),
    os.path.join(localappdata, "Microsoft", "Office", "UnsavedFiles"),
    temp,
    "c:\\Users\\USUARIO\\Documents\\GitHub\\Catalogo"
]

for p in search_paths:
    if os.path.exists(p):
        print(f"\nChecking directory: {p}")
        try:
            for root, dirs, files in os.walk(p):
                for f in files:
                    if 'lista' in f.lower() or 'inmobiliarias' in f.lower() or f.startswith('~$') or f.endswith('.xar') or f.endswith('.xlsb'):
                        full_p = os.path.join(root, f)
                        print(f"Found candidate: {full_p} (size: {os.path.getsize(full_p)} bytes, mtime: {os.path.getmtime(full_p)})")
        except Exception as e:
            print(f"Error reading {p}: {e}")
