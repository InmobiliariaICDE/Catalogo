import re
import sys

def parse_javascript(js_code, block_name):
    # Stack of open brackets/braces/parentheses, each item is (char, line, col)
    stack = []
    
    # State tracking
    in_sq = False # Single quote string
    in_dq = False # Double quote string
    in_bt = False # Backtick string
    in_slc = False # Single-line comment
    in_mlc = False # Multi-line comment
    
    # Track position
    line_no = 1
    col_no = 1
    
    # Template literal nested expressions stack of brace counts
    # Each time we enter a ${} inside a backtick string, we record the size of the stack
    # so we know when the matching } is closing the template expression.
    bt_braces_stack = []
    
    idx = 0
    while idx < len(js_code):
        c = js_code[idx]
        
        # Newline handling
        if c == '\n':
            line_no += 1
            col_no = 1
            in_slc = False # Single-line comment ends at newline
            idx += 1
            continue
        elif c == '\r':
            idx += 1
            continue
            
        col = col_no
        col_no += 1
        
        if in_slc:
            idx += 1
            continue
            
        if in_mlc:
            if idx + 1 < len(js_code) and c == '*' and js_code[idx+1] == '/':
                in_mlc = False
                idx += 2
                col_no += 1
            else:
                idx += 1
            continue
            
        if in_sq:
            if c == "'":
                in_sq = False
            elif c == '\\':
                idx += 2
                col_no += 1
                continue
            idx += 1
            continue
            
        if in_dq:
            if c == '"':
                in_dq = False
            elif c == '\\':
                idx += 2
                col_no += 1
                continue
            idx += 1
            continue
            
        if in_bt:
            # Handle ${
            if idx + 1 < len(js_code) and c == '$' and js_code[idx+1] == '{':
                bt_braces_stack.append(len(stack))
                stack.append(('{', line_no, col))
                idx += 2
                col_no += 1
                in_bt = False # We temporarily exit backtick string state to parse normal JS expression
                continue
            if c == '`':
                in_bt = False
            elif c == '\\':
                idx += 2
                col_no += 1
                continue
            idx += 1
            continue
            
        # Not in string or comment
        # Check comment start
        if idx + 1 < len(js_code) and c == '/' and js_code[idx+1] == '/':
            in_slc = True
            idx += 2
            col_no += 1
            continue
            
        if idx + 1 < len(js_code) and c == '/' and js_code[idx+1] == '*':
            in_mlc = True
            idx += 2
            col_no += 1
            continue
            
        # Check string start
        if c == "'":
            in_sq = True
            idx += 1
            continue
        if c == '"':
            in_dq = True
            idx += 1
            continue
        if c == '`':
            in_bt = True
            idx += 1
            continue
            
        # Check brackets/braces/parentheses
        if c in '({[':
            stack.append((c, line_no, col))
        elif c in ')}]':
            if not stack:
                print(f"[{block_name}] Syntax Error: Unmatched closing character '{c}' at line {line_no}, col {col}")
                # Print context
                start_line = max(1, line_no - 3)
                end_line = line_no + 3
                lines = js_code.splitlines()
                for cur_l in range(start_line, min(len(lines)+1, end_line+1)):
                    prefix = "-> " if cur_l == line_no else "   "
                    print(f"{prefix}{cur_l}: {lines[cur_l-1]}")
                return False
                
            open_c, o_line, o_col = stack.pop()
            
            # Check for correct matching bracket
            expected = {'(': ')', '{': '}', '[': ']'}[open_c]
            if c != expected:
                print(f"[{block_name}] Syntax Error: Mismatched closing character '{c}' at line {line_no}, col {col}. Opened with '{open_c}' at line {o_line}, col {o_col}")
                # Print context
                lines = js_code.splitlines()
                print(f"Opened context at {o_line}: {lines[o_line-1]}")
                print(f"Closed context at {line_no}: {lines[line_no-1]}")
                return False
                
            # If we just closed a template expression brace, re-enter backtick string state
            if open_c == '{' and bt_braces_stack and bt_braces_stack[-1] == len(stack):
                bt_braces_stack.pop()
                in_bt = True
                
        idx += 1
        
    if stack:
        print(f"[{block_name}] Syntax Error: Unclosed opening characters left at end of script:")
        for open_c, o_line, o_col in stack[-5:]:
            print(f"  '{open_c}' opened at line {o_line}, col {o_col}")
        return False
        
    if in_sq or in_dq or in_bt:
        print(f"[{block_name}] Syntax Error: Unclosed string at end of script")
        return False
        
    print(f"[{block_name}] Parsing successful! Correct syntax.")
    return True

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', content, re.DOTALL)
all_ok = True
for i, s in enumerate(scripts):
    if len(s.strip()) == 0:
        continue
    print(f"\nParsing script block {i}...")
    res = parse_javascript(s, f"Block {i}")
    if not res:
        all_ok = False

if all_ok:
    print("\nSUCCESS: All Javascript script blocks are syntactically valid!")
else:
    print("\nFAILURE: One or more Javascript script blocks have syntax errors.")
