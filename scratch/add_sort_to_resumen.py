file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """  const txList=[...lista].sort((a,b)=>{
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

new_block = """  const txList = [...lista];
  if (contSortOrder === 'fecha') {
    txList.sort((a,b) => new Date(b.fecha||0) - new Date(a.fecha||0));
  } else if (contSortOrder === 'categoria') {
    txList.sort((a,b) => (a.categoria||'').localeCompare(b.categoria||''));
  } else if (contSortOrder === 'precio') {
    txList.sort((a,b) => (parseFloat(b.monto||0)) - (parseFloat(a.monto||0)));
  } else {
    txList.sort((a,b) => new Date(b.fecha||0) - new Date(a.fecha||0));
  }

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
  '<div class="cont-panel"><div class="cont-panel-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;"><div class="cont-panel-title">'+panelMovsTitle+'</div>'+
  '<div style="display:flex;gap:10px;align-items:center;">'+
    '<span style="font-size:12px;color:var(--muted);white-space:nowrap;">Ordenar por:</span>'+
    '<select class="form-input" style="width:auto;height:32px;padding:0 8px;background:#18181b;border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:12px;border-radius:8px;cursor:pointer;" onchange="contCambiarOrden(this.value)">'+
      '<option value="fecha"'+(contSortOrder==='fecha'?' selected':'')+'>\uD83D\uDCC5 Fecha</option>'+
      '<option value="categoria"'+(contSortOrder==='categoria'?' selected':'')+'>\uD83C\uDFF7\uFE0F Categor\u00EDa</option>'+
      '<option value="precio"'+(contSortOrder==='precio'?' selected':'')+'>\uD83D\uDCB0 Precio</option>'+
    '</select>'+
    '<button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Nuevo</button>'+
  '</div>'+
  '</div>'+"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Replaced old_block successfully!")
else:
    print("ERROR: Could not find old_block in admin.html")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
