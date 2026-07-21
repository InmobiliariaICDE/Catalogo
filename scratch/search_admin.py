import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find lines with "Cobro" or "Inmueble" near each other, or search for tabs, or "eliminar"
matches = []
for i, line in enumerate(content.splitlines(), 1):
    # check for various keywords
    if any(k in line for k in ['Cobro', 'Inmueble', 'Silvia', 'eliminar', 'Eliminar', 'delete', 'Delete', 'btn-danger']):
        matches.append((i, line))

with open('scratch/search_results.txt', 'w', encoding='utf-8') as out:
    out.write(f"Found {len(matches)} potential lines.\n")
    for line_num, text in matches:
        out.write(f"{line_num}: {text}\n")

print(f"Results written to scratch/search_results.txt")
