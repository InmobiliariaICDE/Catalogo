with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_refs = ['matrixDetailModal', 'adminPropertyEditModal']
for ref in old_refs:
    count = content.count(ref)
    print(f'Old ref "{ref}": {count} occurrences')

new_refs = ['adminUnifiedModal', 'closeUnifiedModal', 'switchUnifiedTab']
for ref in new_refs:
    count = content.count(ref)
    print(f'New ref "{ref}": {count} occurrences')

print()
print('File size:', len(content), 'bytes')
print('File lines:', content.count('\n'))
