import sys

with open('ExtractorFotos.gs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

level = 0
in_block_comment = False

out_lines = []

for i, line in enumerate(lines):
    line_num = i + 1
    # Handle block comments
    if '/*' in line:
        in_block_comment = True
    if '*/' in line:
        in_block_comment = False
        continue
    if in_block_comment:
        continue
        
    # Remove single line comments
    clean = line.split('//')[0]
    
    # Strip strings to avoid braces in literals
    temp = ""
    in_string = False
    string_char = None
    escaped = False
    
    for char in clean:
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
            continue
        if char in ["'", '"', '`']:
            if not in_string:
                in_string = True
                string_char = char
            elif string_char == char:
                in_string = False
            continue
        if not in_string:
            temp += char
            
    for char in temp:
        if char == '{':
            level += 1
            # Avoid encoding errors by replacing non-ascii
            safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
            out_lines.append(f"L{line_num} (+): {safe_line} -> LEVEL {level}")
        elif char == '}':
            level -= 1
            safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
            out_lines.append(f"L{line_num} (-): {safe_line} -> LEVEL {level}")

with open('scratch/trace_output.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out_lines))

print("Trace completed successfully, saved to scratch/trace_output.txt")
