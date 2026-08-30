import subprocess, json

# Search git commits for admin_data.json content containing LOCAL 1
cmd = ["git", "log", "-p", "-SLOCAL 1", "admin_data.json"]
try:
    out = subprocess.check_output(cmd, encoding="utf-8", errors="ignore")
    print("Git diff log for LOCAL 1:")
    print(out[:2000])
except Exception as e:
    print("Error running git log:", e)

# Also search git objects or commits in repo
cmd_commits = ["git", "rev-list", "--all"]
try:
    commits = subprocess.check_output(cmd_commits, encoding="utf-8", errors="ignore").splitlines()
    for c in commits[:20]:
        try:
            data_str = subprocess.check_output(["git", "show", f"{c}:admin_data.json"], encoding="utf-8", errors="ignore")
            d = json.loads(data_str)
            props = [p for p in d.get('properties', []) if 'LOCAL 1' in p.get('name', '').upper()]
            if props:
                print(f"\nFOUND LOCAL 1 IN COMMIT {c[:8]}!")
                print(json.dumps(props[0], indent=2, ensure_ascii=False))
                break
        except Exception:
            pass
except Exception as e:
    print("Error searching commits:", e)
