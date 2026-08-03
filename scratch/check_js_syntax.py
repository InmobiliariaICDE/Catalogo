import re, subprocess, os

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Extract script content from admin.html
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"Found {len(scripts)} script tags in admin.html")

full_script = "\n".join(scripts)
with open('scratch/temp_admin_script.js', 'w', encoding='utf-8') as f:
    f.write(full_script)

print("Testing node syntax check on extracted script...")
res = subprocess.run(['node', '--check', 'scratch/temp_admin_script.js'], capture_output=True, text=True)
if res.returncode == 0:
    print("✓ Syntax check PASSED for admin.html scripts!")
else:
    print("❌ Syntax error in admin.html scripts:")
    print(res.stderr)

with open('contabilidad_script.js', 'r', encoding='utf-8', errors='ignore') as f:
    c_script = f.read()

with open('scratch/temp_cont_script.js', 'w', encoding='utf-8') as f:
    f.write(c_script)

res2 = subprocess.run(['node', '--check', 'scratch/temp_cont_script.js'], capture_output=True, text=True)
if res2.returncode == 0:
    print("✓ Syntax check PASSED for contabilidad_script.js!")
else:
    print("❌ Syntax error in contabilidad_script.js:")
    print(res2.stderr)
