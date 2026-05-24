import subprocess
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

git_path = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.5.10\resources\app\git\cmd\git.exe"

def run_git(args):
    cmd = [git_path] + args
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    return res.stdout, res.stderr

# Get the file content at Thursday commit
out, err = run_git(["show", "695a1c29:admin.html"])
lines = out.splitlines()

for i in range(7174, 7215):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")
