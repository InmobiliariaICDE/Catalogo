import sys, re
sys.stdout.reconfigure(encoding='utf-8')
f = open('admin.html', encoding='utf-8')
content = f.read()
f.close()

# Find all edProp* IDs referenced in JS (getElementById)
js_ids = set(re.findall(r"getElementById\('(edProp[^']+)'\)", content))
# Find all edProp* IDs in HTML id= attributes
html_ids = set(re.findall(r'id="(edProp[^"]+)"', content))

print('--- IDs used in JS but NOT found as HTML id= attr ---')
for x in sorted(js_ids - html_ids):
    # Find which lines reference this id
    lines = content.splitlines()
    lnums = [i+1 for i, l in enumerate(lines) if x in l]
    print(f'  MISSING: {x}  (lines: {lnums})')

print()
print('--- IDs in HTML but NOT used in JS ---')
for x in sorted(html_ids - js_ids):
    print(f'  UNUSED: {x}')

print()
print('--- All edProp IDs in HTML ---')
for x in sorted(html_ids):
    print(f'  {x}')
