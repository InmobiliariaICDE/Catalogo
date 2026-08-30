import subprocess

GIT = r"C:\Users\USUARIO\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"

def run_git(args):
    res = subprocess.run([GIT] + args, capture_output=True, text=True)
    return res.stdout

print("Git add admin.html...")
run_git(["add", "admin.html"])

print("Git commit...")
c_res = run_git(["commit", "-m", "Fix missing closing select tag for adminYearSelect in admin.html causing matrix table render truncation"])
print("Commit output:", c_res)

print("Git push...")
p_res = run_git(["push"])
print("Push output:", p_res)
