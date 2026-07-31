import re

with open('admin.html', encoding='utf-8') as f:
    lines = f.readlines()

script_lines = lines[14527:16984]

for idx, l in enumerate(script_lines, 14528):
    s = l.strip()
    if s.startswith('//') or s.startswith('/*'):
        continue
    
    in_sq = False
    in_dq = False
    in_bt = False
    escaped = False
    for char in l:
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
            continue
        if char == "'" and not in_dq and not in_bt:
            in_sq = not in_sq
        elif char == '"' and not in_sq and not in_bt:
            in_dq = not in_dq
        elif char == '`' and not in_sq and not in_dq:
            in_bt = not in_bt
    if in_sq:
        print(f"Unclosed single quote at line {idx}: {s[:100]}")
    if in_dq:
        print(f"Unclosed double quote at line {idx}: {s[:100]}")
    if in_bt:
        print(f"Unclosed backtick at line {idx}: {s[:100]}")

print("Done quote check!")
