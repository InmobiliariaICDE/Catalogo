import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Find start line of contabilidad script (around line 15400) and end line </script>
start_line = 0
end_line = 0
for idx, line in enumerate(lines):
    if 'contMovimientos' in line and 'let ' in line:
        start_line = idx
        break

for idx in range(start_line, len(lines)):
    if '</script>' in lines[idx]:
        end_line = idx
        break

print(f"Contabilidad script spans lines {start_line+1} to {end_line+1}")

def check_brackets(lines_subset, start_num):
    stack = []
    in_string = None
    escaped = False
    
    for idx, line in enumerate(lines_subset):
        line_num = start_num + idx
        i = 0
        while i < len(line):
            ch = line[i]
            
            # handle strings & comments simple check
            if line[i:i+2] == '//' and not in_string:
                break # rest of line is comment
                
            if ch in '({[' and not in_string:
                stack.append((ch, line_num))
            elif ch in ')}]' and not in_string:
                if not stack:
                    print(f"Unmatched '{ch}' at line {line_num}")
                    return False
                top, l = stack.pop()
                expected = {'(':')', '{':'}', '[':']'}[top]
                if ch != expected:
                    print(f"Mismatched bracket at line {line_num}: expected '{expected}' for '{top}' from line {l}, got '{ch}'")
                    return False
            i += 1

    if stack:
        top, l = stack[-1]
        print(f"Unclosed '{top}' from line {l}")
        return False
    
    print("ALL BRACKETS PASSED CLEANLY!")
    return True

check_brackets(lines[start_line:end_line], start_line + 1)
