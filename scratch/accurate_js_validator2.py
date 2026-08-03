import sys, re
sys.stdout.reconfigure(encoding='utf-8')

def validate_js_text(text, name):
    stack = []
    in_string = None
    in_comment = False
    in_block_comment = False
    escaped = False

    lines = text.split('\n')
    i = 0
    length = len(text)
    line_num = 1
    col_num = 1

    while i < length:
        ch = text[i]
        
        if ch == '\n':
            line_num += 1
            col_num = 1
            if in_comment:
                in_comment = False
            i += 1
            continue

        if in_comment:
            i += 1
            col_num += 1
            continue

        if in_block_comment:
            if text[i:i+2] == '*/':
                in_block_comment = False
                i += 2
                col_num += 2
                continue
            i += 1
            col_num += 1
            continue

        if in_string:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == in_string:
                in_string = None
            i += 1
            col_num += 1
            continue

        # Check start of comment
        if text[i:i+2] == '//':
            in_comment = True
            i += 2
            col_num += 2
            continue
        if text[i:i+2] == '/*':
            in_block_comment = True
            i += 2
            col_num += 2
            continue

        # Check string start
        if ch in ('"', "'", '`'):
            in_string = ch
            i += 1
            col_num += 1
            continue

        # Brackets
        if ch in '({[':
            stack.append((ch, line_num, col_num))
        elif ch in ')}]':
            if not stack:
                print(f"Syntax Error in {name}: Unexpected '{ch}' at Line {line_num}:{col_num}")
                return False
            top, l, c = stack.pop()
            expected = {'(':')', '{':'}', '[':']'}[top]
            if ch != expected:
                print(f"Syntax Error in {name}: Expected '{expected}' for '{top}' from Line {l}:{c}, but found '{ch}' at Line {line_num}:{col_num}")
                return False

        i += 1
        col_num += 1

    if stack:
        top, l, c = stack[-1]
        print(f"Syntax Error in {name}: Unclosed '{top}' from Line {l}:{c}")
        return False

    print(f"OK {name}: NO SYNTAX OR BRACKET ERRORS!")
    return True

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Validate each script tag in admin.html
for m_idx, m in enumerate(re.finditer(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)):
    script_text = m.group(1)
    # Calculate starting line number in admin.html
    start_line = html[:m.start()].count('\n') + 1
    print(f"Validating <script> tag #{m_idx+1} (starts at line {start_line})...")
    validate_js_text(script_text, f"admin.html script #{m_idx+1}")

with open('contabilidad_script.js', 'r', encoding='utf-8', errors='ignore') as f:
    cont_js = f.read()

validate_js_text(cont_js, "contabilidad_script.js")
