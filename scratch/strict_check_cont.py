import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

cont_lines = lines[15420:17180]
code = "".join(cont_lines)

def check_strict(code, base_line):
    stack = []
    i = 0
    length = len(code)
    line = 1
    
    in_str = None
    in_comment = False
    in_block = False

    while i < length:
        ch = code[i]
        
        if ch == '\n':
            line += 1
            if in_comment: in_comment = False
            i += 1
            continue
            
        if in_comment:
            i += 1
            continue
            
        if in_block:
            if code[i:i+2] == '*/':
                in_block = False
                i += 2
            else:
                i += 1
            continue
            
        if in_str:
            if code[i-1] != '\\' and ch == in_str:
                in_str = None
            i += 1
            continue
            
        if code[i:i+2] == '//':
            in_comment = True
            i += 2
            continue
            
        if code[i:i+2] == '/*':
            in_block = True
            i += 2
            continue
            
        if ch in ('"', "'", '`'):
            in_str = ch
            i += 1
            continue
            
        if ch in '({[':
            stack.append((ch, base_line + line - 1))
        elif ch in ')}]':
            if not stack:
                print(f"Extra closing '{ch}' at line {base_line + line - 1}")
                return False
            top, l = stack.pop()
            exp = {'(':')', '{':'}', '[':']'}[top]
            if ch != exp:
                print(f"Mismatched '{ch}' at line {base_line + line - 1}, expected '{exp}' for '{top}' from line {l}")
                return False
        i += 1

    if stack:
        top, l = stack[-1]
        print(f"Unclosed '{top}' from line {l}")
        return False
        
    print(f"Contabilidad lines {base_line} to {base_line+len(cont_lines)} is 100% PERFECT!")
    return True

check_strict(code, 15421)
