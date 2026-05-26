with open('ExtractorFotos.gs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Let's count open/close braces
open_braces = 0
close_braces = 0
current_func = None
func_start_line = 0

for i, line in enumerate(lines):
    line_num = i + 1
    # Strip comments to avoid false brace counts
    clean_line = line.split('//')[0]
    # Handle block comments (basic check)
    if '/*' in clean_line or '*/' in clean_line:
        # Ignore for simple check
        pass
    
    # Check for function keyword
    if 'function ' in clean_line:
        print(f"L{line_num}: Function definition: {clean_line.strip()} (Braces: {open_braces - close_braces})")
        
    for char in clean_line:
        if char == '{':
            open_braces += 1
        elif char == '}':
            close_braces += 1
            
    # If brace level returns to 0
    if open_braces == close_braces and open_braces > 0:
        # Reset counter for next top-level scope
        # print(f"L{line_num}: Scope closed (Total open/close: {open_braces}/{close_braces})")
        open_braces = 0
        close_braces = 0
