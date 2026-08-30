with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

with open('scratch/status_calc_lines.txt', 'w', encoding='utf-8') as out:
    for idx, l in enumerate(lines):
        if any(k in l for k in ['NEW_CONTRACT', 'UNSTARTED', 'start_date', 'preavisos', 'incrementos']):
            out.write(f"L{idx+1}: {l.strip()}\n")

print("Wrote status_calc_lines.txt")
