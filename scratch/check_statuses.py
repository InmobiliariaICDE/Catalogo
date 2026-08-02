import sys, re

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

matches = re.findall(r'status\s*===?\s*[\'\"][A-Z_]+[\'\"]', c)
print('Status matches in admin.html:', sorted(list(set(matches))))

matches_st = re.findall(r'st\s*===?\s*[\'\"][A-Z_]+[\'\"]', c)
print('st matches in admin.html:', sorted(list(set(matches_st))))
