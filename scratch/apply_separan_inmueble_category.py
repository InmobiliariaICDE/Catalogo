import os

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace option tag in modal
old_opt = '<option value="Arriendo">🔑 Arriendo</option>'
new_opt = '<option value="Separan Inmueble">🔑 Separan Inmueble</option>'
if old_opt in content:
    content = content.replace(old_opt, new_opt)
    print("Replaced Arriendo option in admin.html!")

# Update CONT_CAT_ICONS in admin.html
old_icons = "'Venta de Inmueble':'\\uD83C\\uDFE0','Arriendo':'\\uD83D\\uDD11'"
new_icons = "'Venta de Inmueble':'\\uD83C\\uDFE0','Separan Inmueble':'\\uD83D\\uDD11','Arriendo':'\\uD83D\\uDD11'"
if old_icons in content:
    content = content.replace(old_icons, new_icons)
    print("Updated CONT_CAT_ICONS in admin.html!")

# Update ingresosCats in admin.html
old_ing_cats = "const ingresosCats=['Venta de Inmueble','Arriendo'"
new_ing_cats = "const ingresosCats=['Venta de Inmueble','Separan Inmueble','Arriendo'"
if old_ing_cats in content:
    content = content.replace(old_ing_cats, new_ing_cats)
    print("Updated ingresosCats in admin.html!")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Update contabilidad_script.js if exists
js_path = "contabilidad_script.js"
if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()
    
    if old_icons in js_content:
        js_content = js_content.replace(old_icons, new_icons)
        print("Updated CONT_CAT_ICONS in contabilidad_script.js!")
    if old_ing_cats in js_content:
        js_content = js_content.replace(old_ing_cats, new_ing_cats)
        print("Updated ingresosCats in contabilidad_script.js!")
        
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js_content)

print("Done renaming category to Separan Inmueble!")
