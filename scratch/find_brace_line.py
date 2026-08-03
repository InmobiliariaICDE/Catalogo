import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find Script Block 1 position in html
script_matches = list(re.finditer(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.DOTALL))
block1 = script_matches[1]
block1_start_pos = block1.start(1)
block1_code = block1.group(1)

lines = block1_code.splitlines()
line_start_byte = block1_start_pos

depth = 0
in_string = None
in_comment = False

for line_idx, line in enumerate(lines, 1):
    # Calculate approximate HTML line number
    i = 0
    while i < len(line):
        c = line[i]
        # Very rough brace counting (ignoring string literals for basic check)
        if c == '"' or c == "'" or c == '`':
            if in_string == c:
                in_string = None
            elif not in_string:
                in_string = c
        elif not in_string:
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth < 0:
                    print(f"Negative depth at line {line_idx}: {line}")
        i += 1
    if depth != 0 and line_idx == len(lines):
        print(f"Final depth after last line {line_idx} is: {depth}")

print(f"Total lines in block 1: {len(lines)}")
