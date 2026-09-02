import re

with open('admin.html', encoding='utf-8') as f:
    text = f.read()

# Find all select elements containing PENDING
pattern = re.compile(r'<select[^>]*>(?:(?!</select>).)*?PENDING(?:(?!</select>).)*?</select>', re.DOTALL)
matches = list(pattern.finditer(text))

print(f"Found {len(matches)} status select dropdowns in admin.html:")
for i, m in enumerate(matches):
    content = m.group(0)
    has_paid = 'value="PAID"' in content or 'Pagado' in content
    print(f"Dropdown #{i+1}: 'PAID' present? {has_paid}")
    if not has_paid:
        print("   BROKEN DROPDOWN CONTENT:")
        print(content)
