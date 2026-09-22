import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

user_dir = r"C:\Users\USUARIO"
print("Searching for recent .xlsx, .tmp, .xar, .asd, ~$ files modified in the last 1 hour...")

import time
now = time.time()
one_hour_ago = now - 3600

matches = []

search_roots = [
    os.path.join(user_dir, "AppData", "Roaming", "Microsoft"),
    os.path.join(user_dir, "AppData", "Local", "Microsoft"),
    os.path.join(user_dir, "AppData", "Local", "Temp"),
    os.path.join(user_dir, "Documents")
]

for root_dir in search_roots:
    if not os.path.exists(root_dir):
        continue
    for root, dirs, files in os.walk(root_dir):
        for f in files:
            full_path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(full_path)
                if mtime > one_hour_ago:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in ['.xlsx', '.xls', '.xlsb', '.xlsm', '.tmp', '.xar', '.asd'] or f.startswith('~$'):
                        matches.append((mtime, full_path, os.path.getsize(full_path)))
            except Exception:
                pass

matches.sort(key=lambda x: x[0], reverse=True)

print(f"Found {len(matches)} files modified in the last hour:")
for mtime, path, size in matches[:30]:
    t_str = time.strftime('%H:%M:%S', time.localtime(mtime))
    print(f"[{t_str}] {size:8d} bytes | {path}")
