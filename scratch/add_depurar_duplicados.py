file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add button to renderContabilidad header
old_buttons = """      <button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Agregar Movimiento</button>
      <button class="btn btn-secondary btn-sm" onclick="contAbrirMetas()" title="Metas">\uD83C\uDFAF Metas</button>"""

new_buttons = """      <button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Agregar Movimiento</button>
      <button class="btn btn-secondary btn-sm" onclick="contAbrirMetas()" title="Metas">\uD83C\uDFAF Metas</button>
      <button class="btn btn-secondary btn-sm" onclick="contLimpiarDuplicados()" title="Limpiar Duplicados">🧹 Depurar Duplicados</button>"""

content = content.replace(old_buttons, new_buttons)

# Add contLimpiarDuplicados function
function_code = """
function contLimpiarDuplicados() {
  const initialCount = contMovimientos.length;
  
  // 1. Deduplicar por ID
  let cleaned = contDeduplicarMovimientos(contMovimientos);

  // 2. Deduplicar registros idénticos por firma (fecha + tipo + categoria + descripcion + monto)
  const seenSignatures = new Set();
  const finalMovs = [];

  cleaned.forEach(m => {
    if (m.isAuto) {
      finalMovs.push(m);
      return;
    }
    const signature = `${m.fecha || ''}_${m.tipo || ''}_${(m.categoria || '').trim().toLowerCase()}_${(m.descripcion || '').trim().toLowerCase()}_${parseFloat(m.monto) || 0}`;
    if (!seenSignatures.has(signature)) {
      seenSignatures.add(signature);
      finalMovs.push(m);
    }
  });

  const removedCount = initialCount - finalMovs.length;
  contMovimientos = finalMovs;
  contSave();
  renderContabilidad();

  if (removedCount > 0) {
    toast(`Se depuraron ${removedCount} movimientos duplicados ✓`, 'success');
    if (CONT_SCRIPT_URL) {
      contPushTotal();
    }
  } else {
    toast('No se encontraron movimientos duplicados ✓', 'info');
  }
}
"""

# Place contLimpiarDuplicados before contGuardarMetas
target_before = "function contGuardarMetas()"
content = content.replace(target_before, function_code + "\n" + target_before)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done adding contLimpiarDuplicados!")
