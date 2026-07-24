import os

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace initialization of contMovimientos
old_init = """let contMovimientos = [];
try {
  contMovimientos = JSON.parse(localStorage.getItem('icde_contabilidad') || '[]');
  if (!Array.isArray(contMovimientos)) contMovimientos = [];
} catch (e) {
  console.error("Error al inicializar contMovimientos:", e);
  contMovimientos = [];
}"""

new_init = """function contDeduplicarMovimientos(arr) {
  if (!Array.isArray(arr)) return [];
  const map = new Map();
  arr.forEach(m => {
    if (!m || !m.id) return;
    const cleanId = String(m.id).trim();
    if (!map.has(cleanId)) {
      map.set(cleanId, m);
    } else {
      const existing = map.get(cleanId);
      if (existing.isPending && !m.isPending) {
        map.set(cleanId, m);
      }
    }
  });
  return Array.from(map.values());
}

let contMovimientos = [];
try {
  contMovimientos = JSON.parse(localStorage.getItem('icde_contabilidad') || '[]');
  if (!Array.isArray(contMovimientos)) contMovimientos = [];
  contMovimientos = contDeduplicarMovimientos(contMovimientos);
} catch (e) {
  console.error("Error al inicializar contMovimientos:", e);
  contMovimientos = [];
}"""

content = content.replace(old_init, new_init)

# Replace contSave()
old_save = """function contSave(){localStorage.setItem('icde_contabilidad',JSON.stringify(contMovimientos));}"""
new_save = """function contSave(){
  contMovimientos = contDeduplicarMovimientos(contMovimientos);
  localStorage.setItem('icde_contabilidad', JSON.stringify(contMovimientos));
}"""

content = content.replace(old_save, new_save)

# Replace contCargarDatos()
old_load = """      if (data && Array.isArray(data.movimientos)) {
        // Combinación inteligente: preservar transacciones locales no automáticas marcadas como isPending
        const pendingUpload = contMovimientos.filter(m => !m.isAuto && m.isPending);
        
        contMovimientos = [...data.movimientos, ...pendingUpload];
        localStorage.setItem('icde_contabilidad', JSON.stringify(contMovimientos));

      }"""

new_load = """      if (data && Array.isArray(data.movimientos)) {
        // Combinación inteligente sin duplicados por ID
        const driveIds = new Set(data.movimientos.map(m => String(m.id).trim()));
        const pendingUpload = contMovimientos.filter(m => !m.isAuto && m.isPending && !driveIds.has(String(m.id).trim()));
        
        contMovimientos = contDeduplicarMovimientos([...data.movimientos, ...pendingUpload]);
        localStorage.setItem('icde_contabilidad', JSON.stringify(contMovimientos));
      }"""

content = content.replace(old_load, new_load)

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated admin.html!")

# 2. Update contabilidad_apps_script.js
script_path = "contabilidad_apps_script.js"
with open(script_path, "r", encoding="utf-8") as f:
    script_content = f.read()

old_get = """  const movimientos = [];
  for (let i = 1; i < valuesMovs.length; i++) {
    const row = valuesMovs[i];
    const idVal = colIndices.id !== -1 ? row[colIndices.id] : "";
    if (idVal === null || idVal === undefined || String(idVal).trim() === "") continue;"""

new_get = """  const movimientos = [];
  const seenIds = new Set();
  for (let i = 1; i < valuesMovs.length; i++) {
    const row = valuesMovs[i];
    const idVal = colIndices.id !== -1 ? row[colIndices.id] : "";
    if (idVal === null || idVal === undefined || String(idVal).trim() === "") continue;
    
    const cleanId = String(idVal).trim();
    if (seenIds.has(cleanId)) continue;
    seenIds.add(cleanId);"""

script_content = script_content.replace(old_get, new_get)

with open(script_path, "w", encoding="utf-8") as f:
    f.write(script_content)

print("Updated contabilidad_apps_script.js!")
