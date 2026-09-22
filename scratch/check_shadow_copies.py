import os
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

print("Checking vssadmin shadow copies...")
try:
    res = subprocess.run(["vssadmin", "list", "shadows"], capture_output=True, text=True)
    print(res.stdout)
except Exception as e:
    print("vssadmin error:", e)

# Check OneDrive / Recycle bin
onedrive_path = os.path.expanduser(r"~\OneDrive")
print("OneDrive path exists:", os.path.exists(onedrive_path))
