import subprocess

print("=== GIT SEARCH ===")
res = subprocess.run("git log -p -S \"21\" --oneline", shell=True, capture_output=True, text=True)
print("Git log -S '21':", res.stdout[:1000])

res2 = subprocess.run("git log --oneline -n 30", shell=True, capture_output=True, text=True)
print("\nRecent 30 commits:\n", res2.stdout)
