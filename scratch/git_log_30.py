import subprocess

git_path = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.5.10\resources\app\git\cmd\git.exe"

print("--- Commits log ---")
res = subprocess.run([git_path, "log", "-n", "30", "--oneline"], capture_output=True, text=True, encoding='utf-8')
print(res.stdout)
