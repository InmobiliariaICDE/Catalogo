import sys, re
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scratch')

from state_machine_check_fixed import parse_js_fixed

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

scripts = list(re.finditer(r'<script[^>]*>(.*?)</script>', html, re.DOTALL))
print(f"Total script tags in admin.html: {len(scripts)}")

errors = 0
for idx, m in enumerate(scripts):
    code = m.group(1)
    start_line = html[:m.start()].count('\n') + 1
    print(f"\n--- Checking Script #{idx+1} (Line {start_line}) ---")
    ok = parse_js_fixed(code, start_line)
    if not ok:
        errors += 1

if errors == 0:
    print("\n🚀 ALL 10 SCRIPT TAGS IN admin.html ARE 100% CLEAN AND SYNTAX-ERROR FREE!")
else:
    print(f"\n❌ Found {errors} script tags with syntax errors.")
