file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the javascript calculation variables
old_calc = """  const ocupacionPorcentaje = totalActivos > 0 ? Math.round((ocupados / totalActivos) * 100) : 0;
  const totalComision = totalRecaudado * 0.10;
  const comisionObjetivo = 2000000;
  const progressPercent = Math.round((totalComision / comisionObjetivo) * 100);
  const dashOffset = 263.89 - (263.89 * Math.min(100, progressPercent)) / 100;"""

new_calc = """  const ocupacionPorcentaje = totalActivos > 0 ? Math.round((ocupados / totalActivos) * 100) : 0;
  const totalComision = totalRecaudado * 0.10;
  const comisionEsperada = totalEsperado * 0.10;
  const progressPercent = comisionEsperada > 0 ? Math.round((totalComision / comisionEsperada) * 100) : 0;
  const dashOffset = 263.89 - (263.89 * Math.min(100, progressPercent)) / 100;"""

content = content.replace(old_calc, new_calc)

# 2. Update the label below the SVG circle inside the card
old_sublabel = """          <div style="font-size: 6px; color: var(--muted); font-weight: 700; white-space: nowrap; margin-top: 1px; position: absolute; bottom: -10px;">
            Meta: $2M
          </div>"""

new_sublabel = """          <div style="font-size: 6px; color: var(--muted); font-weight: 700; white-space: nowrap; margin-top: 1px; position: absolute; bottom: -10px;">
            Del Esperado
          </div>"""

content = content.replace(old_sublabel, new_sublabel)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
