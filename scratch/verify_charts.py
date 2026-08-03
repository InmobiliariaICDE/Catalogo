import re

with open('admin.html', 'r', encoding='utf-8') as f:
    c1 = f.read()

with open('contabilidad_script.js', 'r', encoding='utf-8') as f:
    c2 = f.read()

print("admin.html contains chartInvCat:", 'chartInvCat' in c1)
print("contabilidad_script.js contains chartInvCat:", 'chartInvCat' in c2)
print("admin.html contains Doughnut / Presupuesto por Categoría:", 'Presupuesto por Categoría' in c1)
print("contabilidad_script.js contains Doughnut / Presupuesto por Categoría:", 'Presupuesto por Categoría' in c2)
