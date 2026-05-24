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

# Search for any .on('click' in Thursday's code
found = []
for idx, line in enumerate(lines):
    if ".on('click'" in line or '.on("click"' in line:
        found.append((idx + 1, line))

print(f"Found {len(found)} click handlers in Thursday's code:")
for num, text in found:
    print(f"Line {num}: {text.strip()}")
