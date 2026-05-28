import subprocess

git_path = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.5.10\resources\app\git\cmd\git.exe"

commits = ["d9c6be7", "1bcf77c", "cad4c59", "c1d2984", "08ac925"]
for c in commits:
    print(f"=== Commit {c} ===")
    res = subprocess.run([git_path, "show", c, "--", "admin.html"], capture_output=True, text=True, encoding='utf-8')
    # Extract only lines starting with + or - to keep it short
    lines = res.stdout.splitlines()
    for l in lines:
        if (l.startswith("+") or l.startswith("-")) and not l.startswith("+++") and not l.startswith("---"):
            # If it's a long line, truncate it
            if len(l) > 120:
                l = l[:120] + "..."
            print(l)
