with open('admin.html', encoding='utf-8') as f:
    with open('scratch/css_sections.txt', 'w', encoding='utf-8') as out:
        in_style = False
        style_content = []
        for i, line in enumerate(f):
            if '<style>' in line:
                in_style = True
                out.write(f"--- Style Block Start at Line {i+1} ---\n")
            if in_style:
                style_content.append((i+1, line))
            if '</style>' in line:
                in_style = False
                out.write(f"--- Style Block End at Line {i+1} ---\n")
        # Write lines containing admin css
        for idx, line in style_content:
            if any(k in line.lower() for k in ['admin', 'kpi', 'matrix', 'badge', 'silvia']):
                out.write(f"{idx}: {line.strip()}\n")
print("Done extracting styles.")
