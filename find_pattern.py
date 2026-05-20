with open('admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

keywords = ['initMapa', 'google-search-container', 'google-search-suggestions', 'updateSuggestions']
for i, line in enumerate(lines):
    for kw in keywords:
        if kw in line:
            print(f'Line {i+1}: {kw} -> {line.strip()[:150]}')
            break
