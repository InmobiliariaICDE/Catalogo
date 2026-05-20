keywords = ['selección de propiedades', 'casas específicas', '1384']
output_lines = []
for file in ['admin.html', 'index.html']:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                for kw in keywords:
                    if kw.lower() in line.lower():
                        output_lines.append(f'{file}:{i+1} -> {line.strip()[:150]}')
    except Exception as e:
        output_lines.append(f"Error reading {file}: {e}")

with open('search_output.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(output_lines))
print("Done writing to search_output.txt")



