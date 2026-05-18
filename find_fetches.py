import re
with open('admin.html', 'r', encoding='utf-8') as f: content = f.read()
print('admin fetches:')
for match in re.findall(r'fetch\([^)]*\)', content):
    print(match)

with open('index.html', 'r', encoding='utf-8') as f: content = f.read()
print('index fetches:')
for match in re.findall(r'fetch\([^)]*\)', content):
    print(match)
