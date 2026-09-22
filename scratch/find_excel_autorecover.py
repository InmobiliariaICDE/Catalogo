import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

user_dir = r"C:\Users\USUARIO"
search_paths = [
    os.path.join(user_dir, "AppData", "Roaming", "Microsoft", "Excel"),
    os.path.join(user_dir, "AppData", "Local", "Microsoft", "Office"),
    os.path.join(user_dir, "AppData", "Local", "Temp")
]

print("Searching all Office/Excel directories recursively...")
found = []
for sp in search_paths:
    if os.path.exists(sp):
        for root, dirs, files in os.walk(sp):
            for f in files:
                fp = os.path.join(root, f)
                try:
                    sz = os.path.getsize(fp)
                    mt = os.path.getmtime(fp)
                    if sz > 0:
                        found.append((mt, sz, fp))
                except Exception:
                    pass

found.sort(key=lambda x: x[0], reverse=True)
for mt, sz, fp in found[:40]:
    import time
    t_str = time.strftime('%H:%M:%S', time.localtime(mt))
    print(f"[{t_str}] {sz:8d} bytes | {fp}")
