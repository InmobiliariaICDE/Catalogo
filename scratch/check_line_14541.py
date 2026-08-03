import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

lines = html.splitlines()

print("Line 14541 before:")
print(lines[14540])
print(lines[14541])
