import os
import subprocess

possible_git_paths = [
    r"C:\Program Files\Git\cmd\git.exe",
    r"C:\Program Files\Git\bin\git.exe",
    r"C:\Users\USUARIO\AppData\Local\Programs\Git\cmd\git.exe",
    os.path.expanduser(r"~\AppData\Local\GitHubDesktop\app-3.4.14\resources\app\git\cmd\git.exe"),
]

git_bin = None
for path in possible_git_paths:
    if os.path.exists(path):
        git_bin = path
        break

if not git_bin:
    # search AppData
    appdata = os.path.expanduser(r"~\AppData")
    for root, dirs, files in os.walk(appdata):
        if "git.exe" in files:
            git_bin = os.path.join(root, "git.exe")
            break

print("Git binary found:", git_bin)
if git_bin:
    res = subprocess.run([git_bin, "log", "-n", "30", "--oneline"], capture_output=True, text=True)
    print("Recent commits:\n", res.stdout)
