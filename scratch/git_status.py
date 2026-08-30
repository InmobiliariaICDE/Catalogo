import subprocess

GIT = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"
res = subprocess.run([GIT, "status", "--short"], capture_output=True, text=True)
print("Git Status:\n", res.stdout)
