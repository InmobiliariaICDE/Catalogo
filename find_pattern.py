keywords = ['kmz', 'allProps', 'remoteProps', 'customProps', 'matrix']
output_lines = []
for file in ['admin.html']:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                for kw in keywords:
                    if kw.lower() in line.lower():
                        output_lines.append(f'{file}:{i+1} -> {line.strip()[:150]}')
                        break
    except Exception as e:
        output_lines.append(f"Error reading {file}: {e}")

with open('search_output.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(output_lines))
print("Done writing to search_output.txt")
