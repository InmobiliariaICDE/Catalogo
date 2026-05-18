import re
with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# look for "fetch"
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'fetch(' in line:
        print(f"Line {i+1}: {line.strip()}")
        # print next 5 lines
        for j in range(1, 6):
            if i+j < len(lines):
                print(f"  {lines[i+j].strip()}")
        print("-" * 40)
