import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', html)
print('Script srcs:', scripts)

# Find all occurrences of showTab in admin.html
show_tab_calls = re.findall(r'showTab\([^)]+\)', html)
print('showTab calls:', set(show_tab_calls))
