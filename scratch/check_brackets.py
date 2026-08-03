import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

def check_brackets(lines_subset, name):
    stack = []
    for idx, line in enumerate(lines_subset):
        # ignore comments
        clean_line = line.split('//')[0]
        for char_idx, char in enumerate(clean_line):
            if char in '({[':
                stack.append((char, idx + 1, char_idx + 1))
            elif char in ')}]':
                if not stack:
                    print(f"[{name}] Unmatched closing '{char}' at line {idx+1}")
                    return False
                top, l, c = stack.pop()
                expected = {'(':')', '{':'}', '[':']'}[top]
                if char != expected:
                    print(f"[{name}] Mismatched bracket: expected '{expected}' for '{top}' (from line {l}) but found '{char}' at line {idx+1}")
                    return False
    if stack:
        top, l, c = stack[-1]
        print(f"[{name}] Unclosed '{top}' from line {l}")
        return False
    print(f"[{name}] Brackets check PASSED!")
    return True

print("Checking contability script section in admin.html (lines 15400 to 17050)...")
check_brackets(lines[15400:17050], "admin.html contabilidad section")
