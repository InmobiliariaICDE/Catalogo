import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

user_dir = r"C:\Users\USUARIO"
print("Searching for ALL files modified between 18:20 and 18:27 today...")

recent_files = []

for root, dirs, files in os.walk(user_dir):
    # Skip AppData\Local\Packages or node_modules to be fast
    if 'node_modules' in root or '.git' in root or 'AppData\\Local\\Packages' in root:
        continue
    for f in files:
        full_path = os.path.join(root, f)
        try:
            mtime = os.path.getmtime(full_path)
            # Check if modified between 18:20:00 and 18:27:30
            # 18:20:00-05:00 on Sep 21 2026:
            # Let's check mtime in last 30 minutes
            if time.time() - mtime < 1800:
                recent_files.append((mtime, full_path, os.path.getsize(full_path)))
        except Exception:
            pass

recent_files.sort(key=lambda x: x[0], reverse=True)

print(f"Found {len(recent_files)} recent files:")
for mtime, path, size in recent_files[:50]:
    t_str = time.strftime('%H:%M:%S', time.localtime(mtime))
    print(f"[{t_str}] {size:8d} bytes | {path}")
