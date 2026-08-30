with open('scratch/status_calc_lines.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for l in lines:
    # sanitize any non-ascii
    clean_l = l.encode('ascii', errors='ignore').decode('ascii')
    print(clean_l.strip()[:140])
