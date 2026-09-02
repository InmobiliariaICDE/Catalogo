import re

with open('admin.html', encoding='utf-8') as f:
    text = f.read()

select_matches = [m.start() for m in re.finditer(r'<select', text)]
print(f"Total <select> elements in admin.html: {len(select_matches)}")

for i, pos in enumerate(select_matches):
    snippet = text[pos:pos+400]
    print(f"\n--- SELECT #{i+1} at char {pos} ---")
    print(snippet[:300])
