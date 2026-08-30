with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print("Searching start_date parsing in admin.html...")
for idx, l in enumerate(lines):
    if 'start_date' in l:
        print(f"L{idx+1}: {l.strip()[:140]}")
