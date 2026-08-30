import subprocess
import sys

GIT = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"

def run_git(args):
    res = subprocess.run([GIT] + args, capture_output=True)
    return res.stdout.decode('utf-8', errors='ignore')

for c in ['e4d5a9d', '3addd7c', '81fb776']:
    sys.stdout.buffer.write(f"\n================ SHOW COMMIT {c} ================\n".encode('utf-8'))
    out = run_git(["show", c])
    sys.stdout.buffer.write(out[:4000].encode('utf-8'))
