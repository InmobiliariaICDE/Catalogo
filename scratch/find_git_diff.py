import os
import subprocess

def find_git():
    paths = [
        "git",
        r"C:\Program Files\Git\bin\git.exe",
        r"C:\Program Files\Git\cmd\git.exe",
        r"C:\Program Files (x86)\Git\bin\git.exe",
        r"C:\Program Files (x86)\Git\cmd\git.exe",
    ]
    for p in paths:
        try:
            res = subprocess.run([p, "--version"], capture_output=True, text=True)
            if res.returncode == 0:
                return p
        except Exception:
            continue
    
    # Try searching
    for root in [r"C:\Program Files", r"C:\Program Files (x86)", os.environ.get("LocalAppData", "")]:
        if not root: continue
        for r, d, f in os.walk(root):
            if "git.exe" in f:
                p = os.path.join(r, "git.exe")
                return p
    return None

git_path = find_git()
if git_path:
    print(f"Found git at: {git_path}")
    res = subprocess.run([git_path, "diff", "admin.html"], capture_output=True, text=True, encoding='utf-8')
    with open("scratch/git_diff.txt", "w", encoding='utf-8') as df:
        df.write(res.stdout)
    print("Wrote diff to scratch/git_diff.txt")
else:
    print("Git not found anywhere!")
