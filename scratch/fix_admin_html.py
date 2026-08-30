import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's inspect mergeLocalAdminData and renderAdministracionContent in admin.html
print("Checking admin.html for mergeLocalAdminData...")
assert 'function mergeLocalAdminData' in content
assert 'function renderMatrizPagos' in content
print("Found functions!")
