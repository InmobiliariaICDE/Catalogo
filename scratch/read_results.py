with open('scratch/matrix_cell_results.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines in results: {len(lines)}")
for l in lines[:50]:
    print(l.strip()[:140])
