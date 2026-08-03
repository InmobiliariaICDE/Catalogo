import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

lines = html.splitlines()

print("=== Lines 14530 to 14555 in admin.html ===")
for idx in range(14529, min(len(lines), 14555)):
    print(f"Line {idx+1}: {lines[idx]}")
