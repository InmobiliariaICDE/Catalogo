import re
import subprocess
import os

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all script content
scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', html, re.DOTALL)
js_content = "\n".join(scripts)

# Write to temp file
os.makedirs('scratch', exist_ok=True)
with open('scratch/temp_admin_js.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Javascript extracted, size:", len(js_content), "bytes")

# Run node syntax check
try:
    res = subprocess.run(['node', '-c', 'scratch/temp_admin_js.js'], capture_output=True, text=True)
    if res.returncode == 0:
        print("✅ Syntax check passed!")
    else:
        print("❌ Syntax check FAILED:")
        print(res.stderr)
except Exception as e:
    print("Could not run node syntax check:", str(e))
