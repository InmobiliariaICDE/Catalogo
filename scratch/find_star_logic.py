import os

with open('scratch/find_star_results.txt', 'w', encoding='utf-8') as out_f:
    out_f.write("=== SEARCHING FOR STAR '★' OR RENEWAL ALERT LOGIC IN CODEBASE ===\n")
    for root, dirs, files in os.walk('.'):
        if '.git' in root or 'node_modules' in root or 'scratch' in root:
            continue
        for file in files:
            if file.endswith('.html') or file.endswith('.js'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        for idx, l in enumerate(lines):
                            if '★' in l or 'star' in l.lower() or 'renov' in l.lower() or 'incremento' in l.lower() or 'start_date' in l.lower():
                                out_f.write(f"{path}:L{idx+1} -> {l.strip()}\n")
                except Exception:
                    pass

print("Done writing scratch/find_star_results.txt")
