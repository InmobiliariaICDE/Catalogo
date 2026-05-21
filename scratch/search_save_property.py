with open('admin.html', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'saveProperty' in line or 'action=saveProperty' in line:
            print(f"{i+1}: {line.strip()[:120]}")
print("Done.")
