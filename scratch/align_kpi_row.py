file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace display: flex alignment in Card 2
old_card_style = """      <!-- 2. COMISIÓN TOTAL ACUMULADA Y OBJETIVO -->
      <div class="admin-kpi-card" style="--card-accent: var(--gold); display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px;">"""

new_card_style = """      <!-- 2. COMISIÓN TOTAL ACUMULADA Y OBJETIVO -->
      <div class="admin-kpi-card" style="--card-accent: var(--gold); display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 10px 12px;">"""

content = content.replace(old_card_style, new_card_style)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
