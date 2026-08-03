import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find script block containing renderContabilidad
script_pattern = re.compile(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)

found = False
for i, m in enumerate(script_pattern.finditer(html)):
    code = m.group(1)
    if 'function renderContabilidad' in code or 'async function renderContabilidad' in code:
        found = True
        start_line = html[:m.start()].count('\n') + 1
        end_line = html[:m.end()].count('\n') + 1
        print(f"✅ Found renderContabilidad inside script block {i} (lines {start_line} to {end_line})")

if not found:
    print("❌ renderContabilidad NOT found in any script block!")
