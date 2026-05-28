import subprocess

git_path = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.5.10\resources\app\git\cmd\git.exe"

print("--- Git Status ---")
res = subprocess.run([git_path, "status"], capture_output=True, text=True, encoding='utf-8')
print(res.stdout)

print("--- Git Log (Last 5 Commits) ---")
res = subprocess.run([git_path, "log", "-n", "5", "--oneline"], capture_output=True, text=True, encoding='utf-8')
print(res.stdout)

print("--- Git Diff with last commit ---")
res = subprocess.run([git_path, "diff", "HEAD~1", "admin.html"], capture_output=True, text=True, encoding='utf-8')
with open("scratch/git_diff_head.txt", "w", encoding='utf-8') as f:
    f.write(res.stdout)
print("Wrote head diff to scratch/git_diff_head.txt")
