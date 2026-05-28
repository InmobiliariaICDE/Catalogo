import re
import sys

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to find each script block in admin.html and print it out
scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', content, re.DOTALL)
for i, s in enumerate(scripts):
    if len(s.strip()) == 0:
        continue
    # Let's count open/close characters properly
    braces = 0
    parens = 0
    brackets = 0
    
    in_single_line_comment = False
    in_multi_line_comment = False
    in_string_sq = False
    in_string_dq = False
    in_string_bt = False
    
    lines = s.splitlines()
    for l_idx, l in enumerate(lines):
        char_idx = 0
        while char_idx < len(l):
            c = l[char_idx]
            
            # Check comment status
            if in_single_line_comment:
                break # Comment ends at newline, so skip rest of line
            
            if in_multi_line_comment:
                if char_idx + 1 < len(l) and c == '*' and l[char_idx+1] == '/':
                    in_multi_line_comment = False
                    char_idx += 2
                else:
                    char_idx += 1
                continue
                
            if in_string_sq:
                if c == "'":
                    in_string_sq = False
                elif c == '\\':
                    char_idx += 2
                    continue
                char_idx += 1
                continue
                
            if in_string_dq:
                if c == '"':
                    in_string_dq = False
                elif c == '\\':
                    char_idx += 2
                    continue
                char_idx += 1
                continue
                
            if in_string_bt:
                # Handle ${} nested in template literal
                if char_idx + 1 < len(l) and c == '$' and l[char_idx+1] == '{':
                    braces += 1
                    char_idx += 2
                    continue
                if c == '`':
                    in_string_bt = False
                elif c == '\\':
                    char_idx += 2
                    continue
                char_idx += 1
                continue
                
            # Not in any comment or string
            if char_idx + 1 < len(l) and c == '/' and l[char_idx+1] == '/':
                in_single_line_comment = True
                break
                
            if char_idx + 1 < len(l) and c == '/' and l[char_idx+1] == '*':
                in_multi_line_comment = True
                char_idx += 2
                continue
                
            if c == "'":
                in_string_sq = True
                char_idx += 1
                continue
                
            if c == '"':
                in_string_dq = True
                char_idx += 1
                continue
                
            if c == '`':
                in_string_bt = True
                char_idx += 1
                continue
                
            if c == '{':
                braces += 1
            elif c == '}':
                braces -= 1
            elif c == '(':
                parens += 1
            elif c == ')':
                parens -= 1
            elif c == '[':
                brackets += 1
            elif c == ']':
                brackets -= 1
                
            char_idx += 1
            
        in_single_line_comment = False # Ends at newline
        
    print(f'Script Block {i}: braces={braces}, parens={parens}, brackets={brackets}, bt={in_string_bt}, sq={in_string_sq}, dq={in_string_dq}')
