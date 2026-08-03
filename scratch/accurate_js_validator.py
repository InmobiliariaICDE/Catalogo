import sys
sys.stdout.reconfigure(encoding='utf-8')

def validate_js_structure(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    lines = content.split('\n')
    stack = []
    in_string = None
    in_comment = False
    in_block_comment = False
    escaped = False

    i = 0
    length = len(content)
    line_num = 1
    col_num = 1

    while i < length:
        ch = content[i]
        
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
            if content[i:i+2] == '*/':
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
        if content[i:i+2] == '//':
            in_comment = True
            i += 2
            col_num += 2
            continue
        if content[i:i+2] == '/*':
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
                print(f"Syntax Error in {file_path}: Unexpected '{ch}' at Line {line_num}:{col_num}")
                return False
            top, l, c = stack.pop()
            expected = {'(':')', '{':'}', '[':']'}[top]
            if ch != expected:
                print(f"Syntax Error in {file_path}: Expected '{expected}' for '{top}' from Line {l}:{c}, but found '{ch}' at Line {line_num}:{col_num}")
                return False

        i += 1
        col_num += 1

    if stack:
        top, l, c = stack[-1]
        print(f"Syntax Error in {file_path}: Unclosed '{top}' from Line {l}:{c}")
        return False

    print(f"OK {file_path}: NO SYNTAX OR BRACKET ERRORS!")
    return True

validate_js_structure('admin.html')
validate_js_structure('contabilidad_script.js')
