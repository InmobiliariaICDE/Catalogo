import subprocess

git_path = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.5.10\resources\app\git\cmd\git.exe"

print("--- Git Diff between 794635b and HEAD ---")
res = subprocess.run([git_path, "diff", "794635b", "HEAD", "admin.html"], capture_output=True, text=True, encoding='utf-8')
with open("scratch/git_diff_added_fields.txt", "w", encoding='utf-8') as f:
    f.write(res.stdout)
print("Wrote diff to scratch/git_diff_added_fields.txt")
