import json
import os
import subprocess

GIT = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"

def run_git(args):
    res = subprocess.run([GIT] + args, capture_output=True)
    return res.stdout.decode('utf-8', errors='ignore')

print("=== CHECKING HISTORICAL COMMITS FOR TENANT NAMES ===")
commits_res = run_git(["log", "--oneline", "-n", "30", "--", "admin_data.json"])
commits = [l.split()[0] for l in commits_res.strip().splitlines() if l]

found_tenants = {}
for c in commits:
    json_str = run_git(["show", f"{c}:admin_data.json"])
    if json_str:
        try:
            d = json.loads(json_str)
            props = d.get("properties", [])
            for p in props:
                pid = str(p.get("id"))
                tname = p.get("tenant_name")
                if tname and tname.strip():
                    if pid not in found_tenants:
                        found_tenants[pid] = set()
                    found_tenants[pid].add(f"Commit {c}: '{tname}' (Name: {p.get('name')})")
        except Exception:
            pass

print(f"Found tenant names in git history for {len(found_tenants)} properties:")
for pid, t_set in sorted(found_tenants.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 999):
    print(f"  Property ID {pid}:")
    for t in t_set:
        print(f"    -> {t}")

print("\n=== CHECKING HTML BACKUPS FOR TENANT NAMES ===")
for filename in ['admin_backup.html', 'admin_corrupted.html', 'adminreferenciavieja.html']:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            if 'tenant_name' in content or 'inquilino' in content.lower():
                print(f"Found tenant references in {filename} (size={len(content)})")
