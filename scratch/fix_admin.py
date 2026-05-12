
import re
content = open('admin.html', encoding='utf-8').read()

start_match = re.search(r'/\*.*PROPS GRID.*\*/', content)
end_match = re.search(r'function guardarLead', content)

if start_match and end_match:
    start_idx = start_match.start()
    end_idx = end_match.start()
    
    new_func = """function renderPropsGrid(listaForzada){
  const el=document.getElementById('propsGrid'); if(!el) return;
  let lista = listaForzada || filtrarProps(nuevoLead.filtros, true);
  const total = lista.length;

  if(!total){ el.innerHTML='<div class="empty">No hay propiedades con estos filtros</div>'; return; }

  const start = nlPage * PAGE_SIZE;
  const sliced = lista.slice(start, start + PAGE_SIZE);
  const maxPage = Math.ceil(total / PAGE_SIZE) - 1;

  let html = '<div class="props-grid">';
  for (let i = 0; i < sliced.length; i++) {
    const d = sliced[i];
    const cod = String(d['Código'] || "");
    const sel = selectedProps.includes(cod);
    const img = (d['Imagenes']||"").split('|')[0].trim() || d['Image'] || 'https://i.imgur.com/Pc9M3I8.png';
    const isDestacada = ["Directo", "Verbal"].includes(d["Contrato"]);
    const inmob = d['Inmobiliaria'] || '';
    
    html += '<div class="prop-card' + (sel?' selected':'') + (isDestacada?' recomendado':'') + '" onclick="abrirModalProp(\'' + eq(cod) + '\')" onmouseenter="focusProperty(\'' + eq(cod) + '\')">';
    if(isDestacada) html += '<div class="ribbon"><span>¡Destacada!</span></div>';
    html += '<div class="prop-card-selector" onclick="event.stopPropagation(); toggleProp(\'' + eq(cod) + '\', this.parentElement)">' + (sel?'✓':'+') + '</div>';
    html += '<img src="' + img + '" loading="lazy" onerror="this.src=\'https://i.imgur.com/Pc9M3I8.png\'"/>';
    html += '<div class="prop-card-body">';
    html += '<div class="prop-card-code" style="font-weight:bold; color:var(--gold);">Cód: ' + cod + '</div>';
    html += '<div class="prop-card-name">' + (d['Nombre']||"") + '</div>';
    html += '<div class="prop-card-price" style="font-size:1.1rem; margin-bottom:8px;">' + formatP(d['Precio']) + '</div>';
    
    if(String(d['Rentabilidad']||"").trim()) {
      html += `<div style="font-size:11px; font-weight:700; color:var(--gold); margin-top:4px;">${d['Rentabilidad']}</div>`;
    }
    
    if (inmob) {
      html += '<div class="prop-card-inmob" style="font-size:10px; color:#888; margin-top:6px;">🏢 ' + inmob + '</div>';
    }
    html += '</div></div>';
  }
  html += '</div>';

  if(total > PAGE_SIZE){
    html += '<div class="pagination" style="display:flex; align-items:center; justify-content:center; gap:16px; margin-top:24px; padding:16px 0; border-top:1px solid rgba(212,168,75,0.1);">';
    html += '<button class="btn btn-sm ' + (nlPage===0?\'btn-secondary\':\'btn-gold\') + '" ' + (nlPage===0?\'disabled\':\'\') + ' onclick="changeNlPage(-1)">« Anterior</button>';
    html += '<span style="font-size:13px; color:var(--muted); font-weight:500;">Página <strong>' + (nlPage+1) + '</strong> de ' + (maxPage+1) + '</span>';
    html += '<button class="btn btn-sm ' + (nlPage===maxPage?\'btn-secondary\':\'btn-gold\') + '" ' + (nlPage===maxPage?\'disabled\':\'\') + ' onclick="changeNlPage(1)">Siguiente »</button>';
    html += '</div>';
  }
  el.innerHTML = html;
}

function changeNlPage(delta){
  nlPage += delta;
  renderPropsGrid();
  document.getElementById('propsGrid').scrollIntoView({behavior:\'smooth\', block:\'start\'});
}

function toggleProp(cod,el){
  const idx=selectedProps.indexOf(cod);
  if(idx>=0){ 
    selectedProps.splice(idx,1); 
    if(el) {
      el.classList.remove('selected'); 
      const sel = el.querySelector('.prop-card-selector');
      if(sel) sel.textContent = '+';
    }
  } else { 
    selectedProps.push(cod);    
    if(el) {
      el.classList.add('selected');    
      const sel = el.querySelector('.prop-card-selector');
      if(sel) sel.textContent = \'✓\';
    }
  }
  const c=document.getElementById('selCnt'); if(c) c.textContent=`${selectedProps.length} seleccionadas`;
}

/* ═══════════════════════════════════════════════
   GUARDAR LEAD
═══════════════════════════════════════════════ */
"""
    new_content = content[:start_idx] + start_match.group(0) + '\n' + new_func + '\n' + content[end_idx:]
    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print(f"Not found: start={start_match}, end={end_match}")
