import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

def parse_js_advanced(html_text):
    script_pattern = re.compile(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', re.DOTALL)
    
    for match in script_pattern.finditer(html_text):
        start_char = match.start(1)
        line_num = html_text[:start_char].count('\n') + 1
        code = match.group(1)
        
        print(f"\n==========================================")
        print(f"Parsing script starting at line {line_num} in admin.html")
        print(f"==========================================")
        
        stack = [] # (char, line, col)
        i = 0
        cur_line = line_num
        cur_col = 1
        
        state_stack = ['NORMAL'] # NORMAL, SINGLE_QUOTE, DOUBLE_QUOTE, TEMPLATE_LITERAL, SINGLE_COMMENT, MULTI_COMMENT
        
        while i < len(code):
            c = code[i]
            cur_state = state_stack[-1]
            
            if c == '\n':
                cur_line += 1
                cur_col = 1
                if cur_state == 'SINGLE_COMMENT':
                    state_stack.pop()
                i += 1
                continue
                
            if cur_state == 'SINGLE_COMMENT':
                i += 1
                cur_col += 1
                continue
                
            if cur_state == 'MULTI_COMMENT':
                if c == '*' and i + 1 < len(code) and code[i+1] == '/':
                    state_stack.pop()
                    i += 2
                    cur_col += 2
                else:
                    i += 1
                    cur_col += 1
                continue
                
            if cur_state in ('SINGLE_QUOTE', 'DOUBLE_QUOTE'):
                if c == '\\':
                    i += 2
                    cur_col += 2
                    continue
                quote_char = "'" if cur_state == 'SINGLE_QUOTE' else '"'
                if c == quote_char:
                    state_stack.pop()
                i += 1
                cur_col += 1
                continue
                
            if cur_state == 'TEMPLATE_LITERAL':
                if c == '\\':
                    i += 2
                    cur_col += 2
                    continue
                elif c == '`':
                    state_stack.pop()
                    i += 1
                    cur_col += 1
                    continue
                elif c == '$' and i + 1 < len(code) and code[i+1] == '{':
                    state_stack.append('NORMAL')
                    stack.append(('${', cur_line, cur_col))
                    i += 2
                    cur_col += 2
                    continue
                else:
                    i += 1
                    cur_col += 1
                    continue
                    
            # NORMAL state
            if c == '/' and i + 1 < len(code):
                if code[i+1] == '/':
                    state_stack.append('SINGLE_COMMENT')
                    i += 2
                    cur_col += 2
                    continue
                elif code[i+1] == '*':
                    state_stack.append('MULTI_COMMENT')
                    i += 2
                    cur_col += 2
                    continue
                    
            if c == "'":
                state_stack.append('SINGLE_QUOTE')
                i += 1
                cur_col += 1
                continue
            elif c == '"':
                state_stack.append('DOUBLE_QUOTE')
                i += 1
                cur_col += 1
                continue
            elif c == '`':
                state_stack.append('TEMPLATE_LITERAL')
                i += 1
                cur_col += 1
                continue
                
            if c in ('{', '(', '['):
                stack.append((c, cur_line, cur_col))
            elif c in ('}', ')', ']'):
                if not stack:
                    print(f"❌ ERROR: Unexpected closing '{c}' at line {cur_line}, col {cur_col}")
                else:
                    top_char, top_line, top_col = stack[-1]
                    matching = {'}': '{', ')': '(', ']': '[', '}': '${'}
                    if top_char == matching.get(c):
                        stack.pop()
                        if top_char == '${':
                            # Popped template expression, return to TEMPLATE_LITERAL state
                            state_stack.pop()
                    else:
                        print(f"❌ ERROR: Mismatched '{c}' at line {cur_line}, col {cur_col}. Expected match for '{top_char}' from line {top_line}, col {top_col}")
                        
            i += 1
            cur_col += 1
            
        if stack:
            print(f"❌ ERROR: Unclosed elements at end of script:")
            for char, l, c in stack:
                print(f"   Unclosed '{char}' opened at line {l}, col {c}")

parse_js_advanced(html)
