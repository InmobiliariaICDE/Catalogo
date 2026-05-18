import re
with open('admin.html', 'r', encoding='utf-8') as f: content = f.read()
print('admin:', len(re.findall(r'data-codigo=', content)))
print('admin_in_script:', len(re.findall(r'"c[oó]digo"\s*:\s*"[^"]+"', content, re.IGNORECASE)))

with open('index.html', 'r', encoding='utf-8') as f: content = f.read()
print('index:', len(re.findall(r'data-codigo=', content)))
print('index_in_script:', len(re.findall(r'"c[oó]digo"\s*:\s*"[^"]+"', content, re.IGNORECASE)))
