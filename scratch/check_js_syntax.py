import re, subprocess, os, sys

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract inline script contents
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"Found {len(scripts)} inline script blocks.")

for i, code in enumerate(scripts):
    filename = f'scratch/test_script_{i}.js'
    with open(filename, 'w', encoding='utf-8') as sf:
        sf.write(code)
    
    # Run node --check
    res = subprocess.run(['node', '--check', filename], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"❌ SYNTAX ERROR IN SCRIPT BLOCK {i}:")
        print(res.stderr[:1000])
    else:
        print(f"✅ Script block {i} OK")
