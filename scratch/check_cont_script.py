with open('contabilidad_script.js', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines):
    line_num = idx + 1
    i = 0
    while i < len(line):
        ch = line[i]
        if line[i:i+2] == '//':
            break
        if ch in '({[':
            stack.append((ch, line_num))
        elif ch in ')}]':
            if not stack:
                print(f"Unmatched '{ch}' at line {line_num}")
                break
            top, l = stack.pop()
            expected = {'(':')', '{':'}', '[':']'}[top]
            if ch != expected:
                print(f"Mismatched bracket at line {line_num}: expected '{expected}' for '{top}' from line {l}, got '{ch}'")
                break
        i += 1

if stack:
    top, l = stack[-1]
    print(f"Unclosed '{top}' from line {l}")
else:
    print("contabilidad_script.js BRACKETS PASSED CLEANLY!")
