import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

cont_lines = lines[15420:17180]
code = "".join(cont_lines)

def parse_debug(text, start_line_num):
    pos = 0
    length = len(text)
    line = start_line_num
    
    stack = []
    modes = ['code']

    while pos < length:
        ch = text[pos]
        nxt = text[pos:pos+2]
        current_mode = modes[-1]
        
        if ch == '\n':
            line += 1
            if current_mode == 'comment_line':
                modes.pop()
            pos += 1
            continue

        if current_mode == 'comment_line':
            pos += 1
            continue

        if current_mode == 'comment_block':
            if nxt == '*/':
                modes.pop()
                pos += 2
            else:
                pos += 1
            continue

        if current_mode == 'str_single':
            if text[pos-1] != '\\' and ch == "'":
                modes.pop()
            pos += 1
            continue

        if current_mode == 'str_double':
            if text[pos-1] != '\\' and ch == '"':
                modes.pop()
            pos += 1
            continue

        if current_mode == 'str_template':
            if text[pos-1] != '\\' and nxt == '${':
                modes.append('code')
                stack.append(('${', line))
                pos += 2
                continue
            elif text[pos-1] != '\\' and ch == '`':
                modes.pop()
                pos += 1
                continue
            else:
                pos += 1
                continue

        # Code mode
        if nxt == '//':
            modes.append('comment_line')
            pos += 2
            continue

        if nxt == '/*':
            modes.append('comment_block')
            pos += 2
            continue

        if ch == "'":
            modes.append('str_single')
            pos += 1
            continue

        if ch == '"':
            modes.append('str_double')
            pos += 1
            continue

        if ch == '`':
            modes.append('str_template')
            pos += 1
            continue

        if ch in '({[':
            stack.append((ch, line))
        elif ch in ')}]':
            if not stack:
                print(f"Unexpected closing '{ch}' at line {line}")
                return False
            top, l = stack.pop()
            if top == '${':
                if ch != '}':
                    print(f"Expected '}}' for '${{' from line {l}, got '{ch}' at line {line}")
                    print("Current Stack:", stack)
                    return False
                modes.pop()
            else:
                exp = {'(':')', '{':'}', '[':']'}[top]
                if ch != exp:
                    print(f"Mismatched '{ch}' at line {line}, expected '{exp}' for '{top}' from line {l}")
                    print("Current Stack:", stack)
                    return False

        pos += 1

    if stack:
        print("Unclosed Stack:", stack)
        return False

    print("🎉 PERFECT PARSE! 0 SYNTAX/BRACKET ERRORS IN CONTABILIDAD!")
    return True

parse_debug(code, 15421)
