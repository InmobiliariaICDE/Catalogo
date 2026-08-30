import glob
import os

logs = glob.glob(r"C:\Users\USUARIO\.gemini\antigravity\brain\19a77b3b-61d3-4dfc-901a-f43bef455a30\.system_generated\tasks\*.log")
print("Found task logs:", logs)
for log in logs:
    print(f"\n=== LOG: {os.path.basename(log)} ===")
    with open(log, 'r', encoding='utf-8', errors='ignore') as f:
        c = f.read()
        print(c[-2000:] if len(c) > 2000 else c)
