import subprocess
import json

GIT = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"

print("=== SEARCHING GIT LOG FOR PORTAL AND NOGALES ===")
res = subprocess.run([GIT, "log", "-S", "Portal", "-i", "--oneline"], capture_output=True, text=True)
print("Git log -S Portal:\n", res.stdout)

res2 = subprocess.run([GIT, "log", "-S", "Nogales", "-i", "--oneline"], capture_output=True, text=True)
print("Git log -S Nogales:\n", res2.stdout)

res3 = subprocess.run([GIT, "log", "-S", "Campo", "-i", "--oneline"], capture_output=True, text=True)
print("Git log -S Campo:\n", res3.stdout)

print("=== CHECKING COMMIT HISTORY OF admin_data.json ===")
res_commits = subprocess.run([GIT, "log", "--oneline", "-n", "20", "--", "admin_data.json"], capture_output=True, text=True)
print("admin_data.json recent commits:\n", res_commits.stdout)

commits = [line.split()[0] for line in res_commits.stdout.strip().splitlines() if line]

for commit in commits[:10]:
    try:
        show_res = subprocess.run([GIT, "show", f"{commit}:admin_data.json"], capture_output=True, text=True)
        if show_res.returncode == 0:
            data = json.loads(show_res.stdout)
            props = data.get("properties", [])
            print(f"Commit {commit}: {len(props)} properties")
            prop_names = [p.get("name") for p in props]
            print(f"  Names: {prop_names}")
    except Exception as e:
        print(f"Error in commit {commit}:", e)
