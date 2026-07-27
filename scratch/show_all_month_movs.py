file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove .slice(0,15) and make title dynamic in contRenderResumen
old_tx_list = """  const txList=[...lista].sort((a,b)=>{
    return new Date(b.fecha||0)-new Date(a.fecha||0);
  }).slice(0,15);
  el.innerHTML=
  '<div class="cont-layout">'+
    '<div class="cont-panel"><div class="cont-panel-header"><div class="cont-panel-title">\uD83D\uDCB9 Ingresos por Servicio</div><span style="font-size:12px;color:var(--gold);font-weight:700;">'+contFmt(ingresos)+'</span></div>'+
    '<div class="cont-panel-body">'+(ingresos===0?'<div class="cont-empty">Sin ingresos.<br><button class="cont-btn-add" onclick="contAbrirModal(\'ingreso\')" style="margin-top:12px;">\u2795 Agregar</button></div>':
      '<div class="cont-chart-wrap"><canvas id="chartIngCat"></canvas></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;">'+
      sI.map(function(e,i){return'<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;"><span style="color:#ccc;display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+ciC[i%ciC.length]+';"></span>'+(CONT_CAT_ICONS[e[0]]||'\u2022')+' '+e[0]+'</span><span style="color:var(--gold);font-weight:700;">'+contFmt(e[1])+'</span></div>';}).join('')+
      '</div>')+'</div></div>'+
    '<div class="cont-panel"><div class="cont-panel-header"><div class="cont-panel-title">\uD83D\uDD34 Egresos por Categor\u00EDa</div><span style="font-size:12px;color:#ef4444;font-weight:700;">'+contFmt(egresos)+'</span></div>'+
    '<div class="cont-panel-body">'+(egresos===0?'<div class="cont-empty">Sin egresos.<br><button class="cont-btn-add" onclick="contAbrirModal(\'egreso\')" style="margin-top:12px;">\u2795 Agregar</button></div>':
      '<div class="cont-chart-wrap"><canvas id="chartEgrCat"></canvas></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;">'+
      sE.map(function(e,i){return'<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;"><span style="color:#ccc;display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+ceC[i%ceC.length]+';"></span>'+(CONT_CAT_ICONS[e[0]]||'\u2022')+' '+e[0]+'</span><span style="color:#ef4444;font-weight:700;">'+contFmt(e[1])+'</span></div>';}).join('')+
      '</div>')+'</div></div>'+
  '</div>'+
  '<div class="cont-panel"><div class="cont-panel-header"><div class="cont-panel-title">\uD83D\uDCCB \u00DAltimos Movimientos</div><button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Nuevo</button></div>'+"""

new_tx_list = """  const txList=[...lista].sort((a,b)=>{
    return new Date(b.fecha||0)-new Date(a.fecha||0);
  });
  const panelMovsTitle = (typeof contMesFiltro !== 'undefined' && contMesFiltro > 0) ? ('\uD83D\uDCCB Movimientos de ' + CONT_MESES_FULL[contMesFiltro - 1]) : '\uD83D\uDCCB \u00DAltimos Movimientos';
  el.innerHTML=
  '<div class="cont-layout">'+
    '<div class="cont-panel"><div class="cont-panel-header"><div class="cont-panel-title">\uD83D\uDCB9 Ingresos por Servicio</div><span style="font-size:12px;color:var(--gold);font-weight:700;">'+contFmt(ingresos)+'</span></div>'+
    '<div class="cont-panel-body">'+(ingresos===0?'<div class="cont-empty">Sin ingresos.<br><button class="cont-btn-add" onclick="contAbrirModal(\'ingreso\')" style="margin-top:12px;">\u2795 Agregar</button></div>':
      '<div class="cont-chart-wrap"><canvas id="chartIngCat"></canvas></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;">'+
      sI.map(function(e,i){return'<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;"><span style="color:#ccc;display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+ciC[i%ciC.length]+';"></span>'+(CONT_CAT_ICONS[e[0]]||'\u2022')+' '+e[0]+'</span><span style="color:var(--gold);font-weight:700;">'+contFmt(e[1])+'</span></div>';}).join('')+
      '</div>')+'</div></div>'+
    '<div class="cont-panel"><div class="cont-panel-header"><div class="cont-panel-title">\uD83D\uDD34 Egresos por Categor\u00EDa</div><span style="font-size:12px;color:#ef4444;font-weight:700;">'+contFmt(egresos)+'</span></div>'+
    '<div class="cont-panel-body">'+(egresos===0?'<div class="cont-empty">Sin egresos.<br><button class="cont-btn-add" onclick="contAbrirModal(\'egreso\')" style="margin-top:12px;">\u2795 Agregar</button></div>':
      '<div class="cont-chart-wrap"><canvas id="chartEgrCat"></canvas></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;">'+
      sE.map(function(e,i){return'<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;"><span style="color:#ccc;display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+ceC[i%ceC.length]+';"></span>'+(CONT_CAT_ICONS[e[0]]||'\u2022')+' '+e[0]+'</span><span style="color:#ef4444;font-weight:700;">'+contFmt(e[1])+'</span></div>';}).join('')+
      '</div>')+'</div></div>'+
  '</div>'+
  '<div class="cont-panel"><div class="cont-panel-header"><div class="cont-panel-title">'+panelMovsTitle+'</div><button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Nuevo</button></div>'+"""

if old_tx_list in content:
    content = content.replace(old_tx_list, new_tx_list)
    print("Replaced txList slice in admin.html!")
else:
    print("ERROR: Could not find old_tx_list in admin.html")

# 2. Update .cont-tx-list CSS max-height
old_css = ".cont-tx-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 4px; }"
new_css = ".cont-tx-list { display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto; padding-right: 4px; }"

if old_css in content:
    content = content.replace(old_css, new_css)
    print("Replaced .cont-tx-list max-height CSS!")
else:
    print("ERROR: Could not find old_css in admin.html")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
