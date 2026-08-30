with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

with open('scratch/matrix_cell_results.txt', 'w', encoding='utf-8') as out_f:
    for idx, l in enumerate(lines):
        if any(k in l.lower() for k in ['★', 'isstartmonth', 'start_date', 'aniversario', 'renovacion', 'matrix-cell', 'status-cell']):
            out_f.write(f"L{idx+1}: {l.strip()}\n")

print("Done writing scratch/matrix_cell_results.txt")
