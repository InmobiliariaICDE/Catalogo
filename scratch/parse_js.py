import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Split html into lines to give exact line numbers in admin.html
html_lines = html.splitlines()

# Function to parse JS token by token
def check_js_syntax_in_html(html_text):
    # Find script blocks with their line numbers in admin.html
    script_pattern = re.compile(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', re.DOTALL)
    
    for match in script_pattern.finditer(html_text):
        start_char = match.start(1)
        # Calculate line number in html_text
        line_num = html_text[:start_char].count('\n') + 1
        code = match.group(1)
        
        print(f"\n==========================================")
        print(f"Parsing script starting at line {line_num} in admin.html")
        print(f"==========================================")
        
        stack = [] # stores (char, line, col)
        i = 0
        cur_line = line_num
        cur_col = 1
        
        in_s_comment = False
        in_m_comment = False
        in_str = None # "'", '"', '`'
        
        while i < len(code):
            c = code[i]
            
            if c == '\n':
                cur_line += 1
                cur_col = 1
                if in_s_comment:
                    in_s_comment = False
                i += 1
                continue
            
            if in_s_comment:
                i += 1
                cur_col += 1
                continue
                
            if in_m_comment:
                if c == '*' and i + 1 < len(code) and code[i+1] == '/':
                    in_m_comment = False
                    i += 2
                    cur_col += 2
                else:
                    i += 1
                    cur_col += 1
                continue
                
            if in_str:
                if c == '\\':
                    i += 2 # skip escaped char
                    cur_col += 2
                    continue
                elif c == in_str:
                    in_str = None
                i += 1
                cur_col += 1
                continue
            
            # Check for comments
            if c == '/' and i + 1 < len(code):
                if code[i+1] == '/':
                    in_s_comment = True
                    i += 2
                    cur_col += 2
                    continue
                elif code[i+1] == '*':
                    in_m_comment = True
                    i += 2
                    cur_col += 2
                    continue
            
            # Check for strings
            if c in ("'", '"', '`'):
                in_str = c
                i += 1
                cur_col += 1
                continue
                
            # Check brackets
            if c in ('{', '(', '['):
                stack.append((c, cur_line, cur_col))
            elif c in ('}', ')', ']'):
                if not stack:
                    print(f"❌ ERROR: Unexpected closing '{c}' at line {cur_line}, col {cur_col}")
                else:
                    top_char, top_line, top_col = stack[-1]
                    matching = {'}': '{', ')': '(', ']': '['}
                    if top_char == matching[c]:
                        stack.pop()
                    else:
                        print(f"❌ ERROR: Mismatched '{c}' at line {cur_line}, col {cur_col}. Expected match for '{top_char}' from line {top_line}, col {top_col}")
            
            i += 1
            cur_col += 1
            
        if stack:
            print(f"❌ ERROR: Unclosed elements at end of script:")
            for char, l, c in stack:
                print(f"   Unclosed '{char}' opened at line {l}, col {c}")

check_js_syntax_in_html(html)
