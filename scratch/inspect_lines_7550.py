import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

lines = html.splitlines()

print("=== Lines 7550 to 7620 in admin.html ===")
for idx in range(7549, min(len(lines), 7620)):
    print(f"Line {idx+1}: {lines[idx]}")
