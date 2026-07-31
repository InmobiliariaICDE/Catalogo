import re

with open('admin.html', encoding='utf-8') as f:
    text = f.read()

# Find script blocks
pattern = re.compile(r'<script[^>]*>(.*?)</script>', re.DOTALL)
matches = list(pattern.finditer(text))

for i, m in enumerate(matches):
    code = m.group(1)
    if 'renderContabilidad' in code:
        print(f"Script block #{i} contains renderContabilidad (length {len(code)})")
        # Find start line number in admin.html
        start_line = text[:m.start()].count('\n') + 1
        end_line = text[:m.end()].count('\n') + 1
        print(f"  Line range: {start_line} to {end_line}")

        # Write this script block to a file for syntax checking
        with open('contabilidad_script.js', 'w', encoding='utf-8') as sf:
            sf.write(code)
        print("Saved script block to contabilidad_script.js")
