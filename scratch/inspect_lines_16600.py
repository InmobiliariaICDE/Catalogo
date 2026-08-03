import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

lines = html.splitlines()

print("=== Lines 16600 to 16620 in admin.html ===")
for idx in range(16599, min(len(lines), 16620)):
    print(f"Line {idx+1}: {lines[idx]}")
