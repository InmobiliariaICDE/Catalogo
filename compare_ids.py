import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

with open('admin.html', 'r', encoding='utf-8') as f:
    admin_content = f.read()

# Extract all data-id attributes
index_ids = set(re.findall(r'data-id="(prop[^"]+)"', index_content))
admin_ids = set(re.findall(r'data-id="(prop[^"]+)"', admin_content))

print(f'Total unique IDs in index.html: {len(index_ids)}')
print(f'Total unique IDs in admin.html: {len(admin_ids)}')

missing = index_ids - admin_ids
print(f'\nIDs in index.html but NOT in admin.html ({len(missing)}):')
for id in sorted(missing):
    print(f'  {id}')

extra = admin_ids - index_ids
print(f'\nIDs in admin.html but NOT in index.html ({len(extra)}):')
for id in sorted(extra):
    print(f'  {id}')
