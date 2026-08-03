import re, sys

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"Found {len(scripts)} inline script blocks.")

for i, code in enumerate(scripts):
    print(f"\n--- Checking Script Block {i} (Length: {len(code)} chars) ---")
    lines = code.splitlines()
    print(f"Total lines: {len(lines)}")
    
    # Simple brace balance check
    open_curly = code.count('{')
    close_curly = code.count('}')
    print(f"Curly braces: {{ = {open_curly}, }} = {close_curly}")
    if open_curly != close_curly:
        print(f"⚠️ MISMATCH in script block {i}: {{ vs }} difference = {open_curly - close_curly}")
        
    open_paren = code.count('(')
    close_paren = code.count(')')
    print(f"Parentheses: ( = {open_paren}, ) = {close_paren}")
    if open_paren != close_paren:
        print(f"⚠️ MISMATCH in script block {i}: ( vs ) difference = {open_paren - close_paren}")
