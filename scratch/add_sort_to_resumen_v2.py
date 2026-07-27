file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """  const txList=[...lista].sort((a,b)=>{
    return new Date(b.fecha||0)-new Date(a.fecha||0);
  });
  const panelMovsTitle = (typeof contMesFiltro !== 'undefined' && contMesFiltro > 0) ? ('\\uD83D\\uDCCB Movimientos de ' + CONT_MESES_FULL[contMesFiltro - 1]) : '\\uD83D\\uDCCB \\u00DAltimos Movimientos';"""

replacement = """  const txList = [...lista];
  if (contSortOrder === 'fecha') {
    txList.sort((a,b) => new Date(b.fecha||0) - new Date(a.fecha||0));
  } else if (contSortOrder === 'categoria') {
    txList.sort((a,b) => (a.categoria||'').localeCompare(b.categoria||''));
  } else if (contSortOrder === 'precio') {
    txList.sort((a,b) => (parseFloat(b.monto||0)) - (parseFloat(a.monto||0)));
  } else {
    txList.sort((a,b) => new Date(b.fecha||0) - new Date(a.fecha||0));
  }

  const panelMovsTitle = (typeof contMesFiltro !== 'undefined' && contMesFiltro > 0) ? ('\\uD83D\\uDCCB Movimientos de ' + CONT_MESES_FULL[contMesFiltro - 1]) : '\\uD83D\\uDCCB \\u00DAltimos Movimientos';"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced sorting logic!")
else:
    print("Target not found!")

target_header = "'<div class=\"cont-panel\"><div class=\"cont-panel-header\"><div class=\"cont-panel-title\">'+panelMovsTitle+'</div><button class=\"cont-btn-add\" onclick=\"contAbrirModal()\">\\u2795 Nuevo</button></div>'+"

replacement_header = "'<div class=\"cont-panel\"><div class=\"cont-panel-header\" style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;\"><div class=\"cont-panel-title\">'+panelMovsTitle+'</div>'+'<div style=\"display:flex;gap:8px;align-items:center;\"><span style=\"font-size:12px;color:var(--muted);white-space:nowrap;\">Ordenar por:</span><select class=\"form-input\" style=\"width:auto;height:32px;padding:0 8px;background:#18181b;border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:12px;border-radius:8px;cursor:pointer;color-scheme:dark;\" onchange=\"contCambiarOrden(this.value)\"><option value=\"fecha\"'+(contSortOrder==='fecha'?' selected':'')+'>\\uD83D\\uDCC5 Fecha</option><option value=\"categoria\"'+(contSortOrder==='categoria'?' selected':'')+'>\\uD83C\\uDFF7\\uFE0F Categor\\u00EDa</option><option value=\"precio\"'+(contSortOrder==='precio'?' selected':'')+'>\\uD83D\\uDCB0 Precio</option></select><button class=\"cont-btn-add\" onclick=\"contAbrirModal()\">\\u2795 Nuevo</button></div></div>'+"

if target_header in content:
    content = content.replace(target_header, replacement_header)
    print("Replaced header logic!")
else:
    print("Header target not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
