from bs4 import BeautifulSoup
import subprocess

with open('../admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
scripts = soup.find_all('script')

js_content = ""
for script in scripts:
    if script.string:
        js_content += script.string + "\n"

with open('extracted_admin.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Extracted JS to extracted_admin.js")

# Let's run a syntax check using node if possible
try:
    res = subprocess.run(['node', '--check', 'extracted_admin.js'], capture_output=True, text=True)
    if res.returncode == 0:
        print("Syntax check passed!")
    else:
        print("Syntax check failed:")
        print(res.stderr)
except Exception as e:
    print(f"Failed to run node check: {e}")
