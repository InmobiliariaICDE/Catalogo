import re

with open('admin.html', encoding='utf-8') as f:
    html = f.read()

# Improved regex handling: skip regex literals like /.../
def check_js(code, offset_line):
    stack = []
    mode_stack = ['code'] # 'code', 'sq_string', 'dq_string', 'template', 'regex', 'comment_line', 'comment_block'

    i = 0
    n = len(code)
    line_no = offset_line
    col_no = 1
    errors = []

    while i < n:
        ch = code[i]
        if ch == '\n':
            line_no += 1
            col_no = 1
            i += 1
            if mode_stack[-1] == 'comment_line':
                mode_stack.pop()
            continue
            
        mode = mode_stack[-1]
        
        if mode == 'comment_line':
            i += 1; col_no += 1; continue
            
        if mode == 'comment_block':
            if ch == '*' and i + 1 < n and code[i+1] == '/':
                mode_stack.pop()
                i += 2; col_no += 2; continue
            i += 1; col_no += 1; continue

        if mode == 'regex':
            if ch == '\\':
                i += 2; col_no += 2; continue
            elif ch == '/':
                mode_stack.pop()
            i += 1; col_no += 1; continue
            
        if mode == 'sq_string':
            if ch == '\\': i += 2; col_no += 2; continue
            elif ch == "'": mode_stack.pop()
            i += 1; col_no += 1; continue
            
        if mode == 'dq_string':
            if ch == '\\': i += 2; col_no += 2; continue
            elif ch == '"': mode_stack.pop()
            i += 1; col_no += 1; continue
            
        if mode == 'template':
            if ch == '\\': i += 2; col_no += 2; continue
            elif ch == '`': mode_stack.pop()
            elif ch == '$' and i + 1 < n and code[i+1] == '{':
                mode_stack.append('code')
                stack.append(('$' + '{', line_no, col_no))
                i += 2; col_no += 2; continue
            i += 1; col_no += 1; continue
            
        if ch == '/' and i + 1 < n and code[i+1] == '/':
            mode_stack.append('comment_line')
            i += 2; col_no += 2; continue
        if ch == '/' and i + 1 < n and code[i+1] == '*':
            mode_stack.append('comment_block')
            i += 2; col_no += 2; continue
            
        if ch == "'":
            mode_stack.append('sq_string')
            i += 1; col_no += 1; continue
        if ch == '"':
            mode_stack.append('dq_string')
            i += 1; col_no += 1; continue
        if ch == '`':
            mode_stack.append('template')
            i += 1; col_no += 1; continue
            
        # Detect regex literal /.../ vs division operator
        if ch == '/':
            # Simple heuristic: if preceding non-space token is operator, assignment, or start of expr
            prev = code[:i].rstrip()
            if prev and prev[-1] in '=(,:;[{!&|?':
                mode_stack.append('regex')
                i += 1; col_no += 1; continue

        if ch == '{' or ch == '[' or ch == '(':
            stack.append((ch, line_no, col_no))
        elif ch == '}' or ch == ']' or ch == ')':
            if not stack:
                errors.append(f"Unexpected '{ch}' at L{line_no}:{col_no}")
            else:
                top, t_line, t_col = stack.pop()
                if ch == '}' and (top != '{' and top != '$' + '{'):
                    errors.append(f"Mismatched '}}' at L{line_no}:{col_no}, expected '{top}' from L{t_line}:{t_col}")
                elif ch == ']' and top != '[':
                    errors.append(f"Mismatched ']' at L{line_no}:{col_no}, expected match for '{top}' from L{t_line}:{t_col}")
                elif ch == ')' and top != '(':
                    errors.append(f"Mismatched ')' at L{line_no}:{col_no}, expected match for '{top}' from L{t_line}:{t_col}")
                if top == '$' + '{' and mode_stack[-1] == 'code':
                    mode_stack.pop()
        i += 1
        col_no += 1

    return errors, stack

matches = list(re.finditer(r'<script[^>]*>(.*?)</script>', html, re.DOTALL))
for script_num, m in enumerate(matches, 1):
    code = m.group(1)
    if not code.strip(): continue
    start_line = html[:m.start()].count('\n') + 1
    errors, stack = check_js(code, start_line)
    print(f"Script #{script_num} (start line {start_line}): errors={len(errors)}, unclosed={len(stack)}")
    for err in errors[:10]:
        print("  err:", err)
    if stack:
        for s in stack[-10:]:
            print("  unclosed:", s)
