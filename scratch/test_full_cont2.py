import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scratch')

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

cont_lines = lines[15420:17267]
code = "".join(cont_lines)

from debug_stack import parse_debug
parse_debug(code, 15421)
