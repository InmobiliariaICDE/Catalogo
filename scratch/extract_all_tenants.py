import json
import re
import os
import subprocess

GIT = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"

def run_git(args):
    res = subprocess.run([GIT] + args, capture_output=True)
    return res.stdout.decode('utf-8', errors='ignore')

print("=== 1. SEARCHING ALL HISTORICAL COMMITS OF admin_data.json FOR TENANT NAMES ===")
commits_res = run_git(["log", "--oneline", "--", "admin_data.json"])
commits = [l.split()[0] for l in commits_res.strip().splitlines() if l]

all_found = {}

for c in commits:
    json_str = run_git(["show", f"{c}:admin_data.json"])
    if json_str:
        try:
            d = json.loads(json_str)
            props = d.get("properties", [])
            for p in props:
                pid = str(p.get("id"))
                name = p.get("name", "")
                tname = p.get("tenant_name", "")
                tphone = p.get("tenant_phone", "")
                if (tname and tname.strip()) or (tphone and tphone.strip()):
                    if pid not in all_found:
                        all_found[pid] = {}
                    key = f"Name: {name}"
                    all_found[pid][key] = (tname, tphone)
        except Exception:
            pass

print(f"Total properties with tenant info in admin_data history: {len(all_found)}")
for pid, val in all_found.items():
    print(f"  Prop ID {pid}: {val}")

print("\n=== 2. PARSING admin_backup.html AND admin_corrupted.html FOR TENANTS ===")
for filename in ['admin_backup.html', 'admin_corrupted.html', 'adminreferenciavieja.html']:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
            # Find JSON objects or property objects containing tenant_name
            matches = re.findall(r'\{\s*"id"\s*:\s*"(\d+)"[^}]*?"tenant_name"\s*:\s*"([^"]+)"[^}]*?\}', content)
            print(f"{filename} regex matches for tenant_name: {len(matches)}")
            for m in matches[:10]:
                print(f"  Match: ID {m[0]} -> Tenant: '{m[1]}'")
