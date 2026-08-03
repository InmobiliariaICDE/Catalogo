import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

script_pattern = re.compile(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)

for i, m in enumerate(script_pattern.finditer(html)):
    code = m.group(1)
    # Check if code contains </script
    matches = list(re.finditer(r'</script', code, re.IGNORECASE))
    if matches:
        print(f"⚠️ Script block {i} contains {len(matches)} occurrences of </script:")
        for match in matches:
            pos = match.start()
            print("  Context:", repr(code[max(0, pos-40):min(len(code), pos+60)]))
    else:
        print(f"✅ Script block {i} clean of </script")
