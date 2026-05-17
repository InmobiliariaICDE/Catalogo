import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

with open('admin.html', 'r', encoding='utf-8') as f:
    admin_content = f.read()

# Find where property cards start in index.html
# Look for common property structures
patterns_to_try = [
    r'data-codigo="([^"]+)"',
    r'data-code="([^"]+)"',
    r'data-ref="([^"]+)"',
    r'data-nombre="([^"]+)"',
    r'onclick="abrirModal\(([^)]+)\)',
    r"onclick='abrirModal\(([^)]+)\)",
    r'data-price="([^"]+)"',
    r'data-tipo="([^"]+)"',
    r'"codigo"\s*:\s*"([^"]+)"',
    r"'codigo'\s*:\s*'([^']+)'",
]

for pattern in patterns_to_try:
    matches_index = re.findall(pattern, index_content)
    matches_admin = re.findall(pattern, admin_content)
    if matches_index:
        print(f"Pattern '{pattern[:50]}' found {len(matches_index)} in index, {len(matches_admin)} in admin")
        print(f"  Sample: {matches_index[:3]}")
        break

# Also look at the JS array or object that stores properties
# Search for a JS variable with many properties
js_array = re.search(r'const\s+propiedades\s*=\s*\[', index_content)
if js_array:
    print(f"\nFound 'propiedades' array at position {js_array.start()}")
    print(index_content[js_array.start():js_array.start()+500])
else:
    print("\nNo 'const propiedades' found, searching other patterns...")
    # Try to find how properties are stored
    for var_name in ['propiedades', 'properties', 'catalog', 'listings', 'inmuebles']:
        idx = index_content.find(f'const {var_name}')
        if idx == -1:
            idx = index_content.find(f'var {var_name}')
        if idx == -1:
            idx = index_content.find(f'let {var_name}')
        if idx != -1:
            print(f"\nFound variable '{var_name}' at position {idx}")
            print(index_content[idx:idx+300])
            break
