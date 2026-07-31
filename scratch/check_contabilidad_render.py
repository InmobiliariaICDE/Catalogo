with open('contabilidad_script.js', encoding='utf-8') as f:
    lines = f.readlines()[2863:]

code = ''.join(lines)
stack = []
mode_stack = ['code']

i = 0
n = len(code)
line_no = 2864
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
        i += 1
        col_no += 1
        continue
        
    if mode == 'comment_block':
        if ch == '*' and i + 1 < n and code[i+1] == '/':
            mode_stack.pop()
            i += 2
            col_no += 2
            continue
        i += 1
        col_no += 1
        continue
        
    if mode == 'sq_string':
        if ch == '\\':
            i += 2
            col_no += 2
            continue
        elif ch == "'":
            mode_stack.pop()
        i += 1
        col_no += 1
        continue
        
    if mode == 'dq_string':
        if ch == '\\':
            i += 2
            col_no += 2
            continue
        elif ch == '"':
            mode_stack.pop()
        i += 1
        col_no += 1
        continue
        
    if mode == 'template':
        if ch == '\\':
            i += 2
            col_no += 2
            continue
        elif ch == '`':
            mode_stack.pop()
        elif ch == '$' and i + 1 < n and code[i+1] == '{':
            mode_stack.append('code')
            stack.append(('$' + '{', line_no, col_no))
            i += 2
            col_no += 2
            continue
        i += 1
        col_no += 1
        continue
        
    if ch == '/' and i + 1 < n and code[i+1] == '/':
        mode_stack.append('comment_line')
        i += 2
        col_no += 2
        continue
    if ch == '/' and i + 1 < n and code[i+1] == '*':
        mode_stack.append('comment_block')
        i += 2
        col_no += 2
        continue
    if ch == "'":
        mode_stack.append('sq_string')
        i += 1
        col_no += 1
        continue
    if ch == '"':
        mode_stack.append('dq_string')
        i += 1
        col_no += 1
        continue
    if ch == '`':
        mode_stack.append('template')
        i += 1
        col_no += 1
        continue
    
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
                errors.append(f"Mismatched ']' at L{line_no}:{col_no}, expected '{top}' from L{t_line}:{t_col}")
            elif ch == ')' and top != '(':
                errors.append(f"Mismatched ')' at L{line_no}:{col_no}, expected '{top}' from L{t_line}:{t_col}")
            if top == '$' + '{' and mode_stack[-1] == 'code':
                mode_stack.pop()
    i += 1
    col_no += 1

print(f"Render contabilidad section: errors={len(errors)}, stack={len(stack)}")
for err in errors:
    print("  err:", err)
if stack:
    for s in stack:
        print("  unclosed:", s)
