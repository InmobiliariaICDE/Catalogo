import subprocess

# Simple check using node if available or basic python regex
with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("admin.html line count:", len(html.splitlines()))
print("Check script tag balance:", html.count('<script>'), html.count('</script>'))
