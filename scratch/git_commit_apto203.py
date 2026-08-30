import subprocess

GIT = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"

def run_git(args):
    res = subprocess.run([GIT] + args, capture_output=True, text=True)
    return res.stdout

print("Git add...")
run_git(["add", "admin.html", "admin_data.json", "Base de datos Admin.xlsx"])

print("Git commit...")
c_res = run_git(["commit", "-m", "Fix contract renewal month indicator for APTO 203 (July) and auto-detect contract renewal months across all properties"])
print("Commit output:", c_res)

print("Git push...")
p_res = run_git(["push"])
print("Push output:", p_res)
