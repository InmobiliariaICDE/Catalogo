import sys
import re

def check_brackets(text):
    stack = []
    lines = text.splitlines()
    for line_num, line in enumerate(lines, 1):
        # Remove strings and comments to avoid false positives
        # Simple string removal (not perfect but helpful)
        clean_line = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', '""', line)
        clean_line = re.sub(r"'[^'\\]*(?:\\.[^'\\]*)*'", "''", clean_line)
        clean_line = re.sub(r'`[^`\\]*(?:\\.[^`\\]*)*`', "``", clean_line)
        # Remove single line comments
        clean_line = re.sub(r'//.*$', '', clean_line)
        
        for char_idx, char in enumerate(clean_line, 1):
            if char in '({[':
                stack.append((char, line_num, char_idx))
            elif char in ')}]':
                if not stack:
                    print(f"Error: Unmatched closing character '{char}' at line {line_num}:{char_idx}")
                    return False
                top_char, top_line, top_idx = stack.pop()
                if (char == ')' and top_char != '(') or \
                   (char == '}' and top_char != '{') or \
                   (char == ']' and top_char != '['):
                    print(f"Error: Mismatched character '{char}' at line {line_num}:{char_idx}. Expected match for '{top_char}' from line {top_line}:{top_idx}")
                    return False
    if stack:
        print(f"Error: Unclosed opening characters left on stack:")
        for top_char, top_line, top_idx in stack:
            print(f"  '{top_char}' at line {top_line}:{top_idx}")
        return False
    print("Brackets/braces are fully matched!")
    return True

f = open('admin.html', encoding='utf-8')
content = f.read()
f.close()

# Extract script blocks
script_pattern = re.compile(r'<script\b[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
for idx, match in enumerate(script_pattern.finditer(content), 1):
    script_content = match.group(1)
    # Find starting line of this script tag
    start_pos = match.start()
    line_offset = content[:start_pos].count('\n') + 1
    print(f"\nChecking script block #{idx} starting at line {line_offset}...")
    
    # Adjust line numbers for check_brackets by offsetting
    stack = []
    lines = script_content.splitlines()
    for line_num, line in enumerate(lines, 1):
        actual_line = line_num + line_offset
        # Remove strings and comments to avoid false positives
        clean_line = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', '""', line)
        clean_line = re.sub(r"'[^'\\]*(?:\\.[^'\\]*)*'", "''", clean_line)
        clean_line = re.sub(r'`[^`\\]*(?:\\.[^`\\]*)*`', "``", clean_line)
        clean_line = re.sub(r'//.*$', '', clean_line)
        
        for char_idx, char in enumerate(clean_line, 1):
            if char in '({[':
                stack.append((char, actual_line, char_idx))
            elif char in ')}]':
                if not stack:
                    print(f"Error: Unmatched closing character '{char}' at line {actual_line}:{char_idx}")
                    break
                top_char, top_line, top_idx = stack.pop()
                if (char == ')' and top_char != '(') or \
                   (char == '}' and top_char != '{') or \
                   (char == ']' and top_char != '['):
                    print(f"Error: Mismatched character '{char}' at line {actual_line}:{char_idx}. Expected match for '{top_char}' from line {top_line}:{top_idx}")
                    break
    if stack:
        print(f"Warning: {len(stack)} unclosed opening characters left in block #{idx} (might be due to multi-line comments/strings):")
        # Print top 5
        for top_char, top_line, top_idx in stack[:5]:
            print(f"  '{top_char}' at line {top_line}:{top_idx}")
