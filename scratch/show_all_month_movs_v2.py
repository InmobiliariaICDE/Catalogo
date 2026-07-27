file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target1 = "  const txList=[...lista].sort((a,b)=>{\n    return new Date(b.fecha||0)-new Date(a.fecha||0);\n  }).slice(0,15);"

replacement1 = """  const txList=[...lista].sort((a,b)=>{
    return new Date(b.fecha||0)-new Date(a.fecha||0);
  });
  const panelMovsTitle = (typeof contMesFiltro !== 'undefined' && contMesFiltro > 0) ? ('\\uD83D\\uDCCB Movimientos de ' + CONT_MESES_FULL[contMesFiltro - 1]) : '\\uD83D\\uDCCB \\u00DAltimos Movimientos';"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced target1!")

target2 = "'<div class=\"cont-panel\"><div class=\"cont-panel-header\"><div class=\"cont-panel-title\">\\uD83D\\uDCCB \\u00DAltimos Movimientos</div><button class=\"cont-btn-add\" onclick=\"contAbrirModal()\">\\u2795 Nuevo</button></div>'+"
replacement2 = "'<div class=\"cont-panel\"><div class=\"cont-panel-header\"><div class=\"cont-panel-title\">'+panelMovsTitle+'</div><button class=\"cont-btn-add\" onclick=\"contAbrirModal()\">\\u2795 Nuevo</button></div>'+"

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced target2!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
