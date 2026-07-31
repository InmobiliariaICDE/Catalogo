import os

file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "function contRenderInversiones(el){"
end_marker = "function contCambiarOrden(val){"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_code = """let contInversionesCustom = null;

function contObtenerInversionesCustom() {
  if (!contInversionesCustom) {
    try {
      contInversionesCustom = JSON.parse(localStorage.getItem('cont_inversiones_custom') || 'null');
    } catch (e) {
      contInversionesCustom = null;
    }
    if (!contInversionesCustom || !Array.isArray(contInversionesCustom)) {
      contInversionesCustom = [
        { id: 'inv-1', titulo: 'Drom - Contratar servicio', categoria: 'Tecnología e IA', precio: 2000000, roi: 50, riesgo: 'baja', horizonte: '1 mes', accion: 'Automatización y servicio Drom para operaciones.', paretoBoost: true },
        { id: 'inv-2', titulo: 'Computador y pantalla 3er puesto', categoria: 'Tecnología e IA', precio: 3000000, roi: 45, riesgo: 'baja', horizonte: '1-2 meses', accion: 'Equipamiento de hardware para 3er puesto de trabajo.', paretoBoost: true },
        { id: 'inv-3', titulo: 'Mapa informativo y marco MDF', categoria: 'Tecnología e IA', precio: 350000, roi: 30, riesgo: 'baja', horizonte: '1 mes', accion: 'Plano impreso $150k + superficie MDF + liviano $150k.', paretoBoost: true },
        { id: 'inv-4', titulo: 'Bot de Marketplace', categoria: 'Marketing Digital', precio: 300000, roi: 50, riesgo: 'baja', horizonte: '1 mes', accion: 'Bot para prospección automática en Marketplace.', paretoBoost: true },
        { id: 'inv-5', titulo: 'Mensualidad Facebook Ads', categoria: 'Marketing Digital', precio: 80000, roi: 40, riesgo: 'baja', horizonte: '1 mes', accion: 'Pauta publicitaria mensual en redes sociales.', paretoBoost: true },
        { id: 'inv-6', titulo: 'Mantenimiento Moto Completo', categoria: 'Transporte / Logística', precio: 350000, roi: 20, riesgo: 'media', horizonte: '1 mes', accion: 'Llantas $120k + alineación/rin + tacómetro $150k.', paretoBoost: false },
        { id: 'inv-7', titulo: 'Vehículo / Carro de Segunda', categoria: 'Transporte / Logística', precio: 23000000, roi: 25, riesgo: 'media', horizonte: '3-6 meses', accion: 'Vehículo/camioneta mediana desde 2020 para captaciones y visitas.', paretoBoost: false },
        { id: 'inv-8', titulo: 'Señalización Oficina Completa', categoria: 'Oficina / Mantenimiento', precio: 250000, roi: 15, riesgo: 'baja', horizonte: '1 mes', accion: 'Salida emergencia, recepción, áreas espera, administración y botiquín.', paretoBoost: false },
        { id: 'inv-9', titulo: 'Losa de cocina y cristales', categoria: 'Oficina / Mantenimiento', precio: 330000, roi: 10, riesgo: 'baja', horizonte: '1 mes', accion: 'Losa blanca Corona (platos, sopas) $250k + Cristales $80k.', paretoBoost: false },
        { id: 'inv-10', titulo: 'Tapete acceso y detalles oficina', categoria: 'Oficina / Mantenimiento', precio: 200000, roi: 12, riesgo: 'baja', horizonte: '1 mes', accion: 'Tapete acceso $100k + matera, plantas y decoración $100k.', paretoBoost: false },
        { id: 'inv-11', titulo: 'Refuerzo Mercado Gastos Fijos', categoria: 'Oficina / Mantenimiento', precio: 200000, roi: 10, riesgo: 'baja', horizonte: '1 mes', accion: 'Mercado, carnes, aseo con facturas.', paretoBoost: false }
      ];
      localStorage.setItem('cont_inversiones_custom', JSON.stringify(contInversionesCustom));
    }
  }
  return contInversionesCustom;
}

function contCalcularConvenienciaPareto(inv, catMap, pd, totalIng) {
  const isParetoVitalCat = pd.some(p => p.is80 && (
    (inv.categoria && inv.categoria.toLowerCase().includes(p.cat.toLowerCase())) ||
    (p.cat.toLowerCase().includes('arriendo') && (inv.categoria.includes('Arriendos') || inv.titulo.includes('Arriendo'))) ||
    (p.cat.toLowerCase().includes('comisi') && (inv.categoria.includes('Venta') || inv.titulo.includes('Captación')))
  ));

  const isTechOrMarketing = inv.categoria.includes('Tecnología') || inv.categoria.includes('Marketing') || (inv.roi && inv.roi >= 35);

  if (isParetoVitalCat || isTechOrMarketing || inv.paretoBoost) {
    return {
      label: '⭐ REC. PARETO (80/20)',
      bg: 'rgba(34,197,94,0.15)',
      color: '#22c55e',
      border: 'rgba(34,197,94,0.3)',
      desc: 'Alta rentabilidad e impacto estratégico en los principales generadores de ingresos'
    };
  } else if ((inv.roi && inv.roi >= 20) || inv.categoria.includes('Transporte') || inv.categoria.includes('Ventas')) {
    return {
      label: '⚖️ MEDIA CONVENIENCIA',
      bg: 'rgba(212,168,75,0.15)',
      color: 'var(--gold)',
      border: 'rgba(212,168,75,0.3)',
      desc: 'Impacto operativo medio o retorno progresivo'
    };
  } else {
    return {
      label: '🔍 COMPLEMENTARIO',
      bg: 'rgba(255,255,255,0.06)',
      color: '#aaa',
      border: 'rgba(255,255,255,0.12)',
      desc: 'Gasto operativo, mantenimiento o confort general'
    };
  }
}

function contAbrirModalInversion(invId) {
  const modal = document.getElementById('modalContInversion');
  if (!modal) return;

  const inputId = document.getElementById('contInvId');
  const inputTitulo = document.getElementById('contInvTitulo');
  const inputCat = document.getElementById('contInvCategoria');
  const inputPrecio = document.getElementById('contInvPrecio');
  const inputRoi = document.getElementById('contInvRoi');
  const inputRiesgo = document.getElementById('contInvRiesgo');
  const inputHoriz = document.getElementById('contInvHorizonte');
  const inputAccion = document.getElementById('contInvAccion');
  const titleEl = document.getElementById('contInvModalTitle');
  const deleteBtn = document.getElementById('btnContInvDelete');

  const customList = contObtenerInversionesCustom();

  if (invId) {
    const item = customList.find(x => String(x.id) === String(invId));
    if (item) {
      inputId.value = item.id;
      inputTitulo.value = item.titulo || '';
      inputCat.value = item.categoria || 'Tecnología e IA';
      inputPrecio.value = item.precio !== undefined ? item.precio : '';
      inputRoi.value = item.roi !== undefined ? item.roi : 30;
      inputRiesgo.value = item.riesgo || 'baja';
      inputHoriz.value = item.horizonte || '1-2 meses';
      inputAccion.value = item.accion || '';
      if (titleEl) titleEl.innerHTML = '✏️ Editar Inversión Proyectada';
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
    }
  } else {
    inputId.value = '';
    inputTitulo.value = '';
    inputCat.value = 'Tecnología e IA';
    inputPrecio.value = '';
    inputRoi.value = 35;
    inputRiesgo.value = 'baja';
    inputHoriz.value = '1-2 meses';
    inputAccion.value = '';
    if (titleEl) titleEl.innerHTML = '💎 Agregar Posible Inversión';
    if (deleteBtn) deleteBtn.style.display = 'none';
  }

  modal.classList.add('open');
}

function contGuardarInversion() {
  const inputId = document.getElementById('contInvId').value;
  const titulo = document.getElementById('contInvTitulo').value.trim();
  const categoria = document.getElementById('contInvCategoria').value;
  const precio = parseFloat(document.getElementById('contInvPrecio').value) || 0;
  const roi = parseFloat(document.getElementById('contInvRoi').value) || 0;
  const riesgo = document.getElementById('contInvRiesgo').value;
  const horizonte = document.getElementById('contInvHorizonte').value.trim() || '1-2 meses';
  const accion = document.getElementById('contInvAccion').value.trim();

  if (!titulo || precio < 0) {
    alert('Por favor completa los campos requeridos con datos válidos.');
    return;
  }

  const customList = contObtenerInversionesCustom();

  if (inputId) {
    const idx = customList.findIndex(x => String(x.id) === String(inputId));
    if (idx !== -1) {
      customList[idx] = {
        id: inputId,
        titulo: titulo,
        categoria: categoria,
        precio: precio,
        roi: roi,
        riesgo: riesgo,
        horizonte: horizonte,
        accion: accion,
        isCustom: true
      };
    }
  } else {
    const newObj = {
      id: 'inv-custom-' + Date.now(),
      titulo: titulo,
      categoria: categoria,
      precio: precio,
      roi: roi,
      riesgo: riesgo,
      horizonte: horizonte,
      accion: accion,
      isCustom: true
    };
    customList.unshift(newObj);
  }

  localStorage.setItem('cont_inversiones_custom', JSON.stringify(customList));
  closeModal('modalContInversion');
  contRenderTabContent();
}

function contEliminarInversion(invIdToDelete) {
  const targetId = invIdToDelete || document.getElementById('contInvId').value;
  if (!targetId) return;

  if (confirm('¿Estás seguro de que deseas eliminar esta inversión de tu lista?')) {
    const customList = contObtenerInversionesCustom();
    const updated = customList.filter(x => String(x.id) !== String(targetId));
    contInversionesCustom = updated;
    localStorage.setItem('cont_inversiones_custom', JSON.stringify(updated));
    closeModal('modalContInversion');
    contRenderTabContent();
  }
}

function contRenderInversiones(el){
  const lista=contGetFiltrado();
  const totalIng=contSumTipo(lista,'ingreso');
  const ingresos=lista.filter(function(m){return m.tipo==='ingreso';});
  const utilidad=totalIng-contSumTipo(lista,'egreso');
  const catMap={};ingresos.forEach(function(m){if(!catMap[m.categoria])catMap[m.categoria]={total:0,count:0};catMap[m.categoria].total+=parseFloat(m.monto||0);catMap[m.categoria].count++;});
  const sortedCats=Object.entries(catMap).sort(function(a,b){return b[1].total-a[1].total;});
  let acum=0;
  const pd=sortedCats.map(function(entry){const cat=entry[0];const data=entry[1];acum+=data.total;const pct=totalIng>0?(data.total/totalIng*100):0;const pctAcum=totalIng>0?(acum/totalIng*100):0;return{cat:cat,total:data.total,count:data.count,pct:pct,pctAcum:pctAcum,is80:pctAcum<=80.1};});
  const n80=Math.max(1,(pd.findIndex(function(p){return p.pctAcum>=80;}))+1);

  const montoPropuesto=utilidad>0?utilidad*0.3:0;

  // Custom user investments
  const customList = contObtenerInversionesCustom();

  const presets = [
    {id: 'preset-1', titulo:'🏠 Ampliar Cartera Ventas', categoria:'Ampliar Cartera Ventas', desc:'Captación de inmuebles exclusivos. Alta rentabilidad por comisiones.',precio:0,roi:28,riesgo:'media',horizonte:'3-6 meses',accion:'Contratar agente de captación. Publicidad en portales especializados.',paretoBoost:!!(catMap['Venta de Inmueble']&&catMap['Venta de Inmueble'].total>0)},
    {id: 'preset-2', titulo:'🔑 Expandir Arriendos', categoria:'Expandir Arriendos', desc:'Más inmuebles en administración. Ingreso recurrente y predecible.',precio:0,roi:22,riesgo:'baja',horizonte:'1-3 meses',accion:'Buscar nuevos propietarios. Paquete de administración premium.',paretoBoost:true},
    {id: 'preset-3', titulo:'📋 Avaluós Premium', categoria:'Avaluós Premium', desc:'Bajo costo operativo, alta demanda. Excelente ROI por hora.',precio:0,roi:35,riesgo:'baja',horizonte:'1 mes',accion:'Certificación en avaluós. Alianza con bancos y entidades.',paretoBoost:true},
    {id: 'preset-4', titulo:'🔨 Remodelación/Reparación', categoria:'Remodelación/Reparación', desc:'Alianzas con contratistas para paquetes integrales.',precio:0,roi:18,riesgo:'media',horizonte:'2-4 meses',accion:'Red de contratistas confiables. Diferenciación como inmobiliaria integral.',paretoBoost:!!(catMap['Remodelación']||catMap['Reparación'])},
    {id: 'preset-5', titulo:'📐 Arquitectura/Diseño', categoria:'Arquitectura/Diseño', desc:'Servicio de valor agregado. Alta demanda en remodelaciones.',precio:0,roi:25,riesgo:'media',horizonte:'3-5 meses',accion:'Alianza con arquitectos locales. Paquetes diseño + gestión de obra.',paretoBoost:!!(catMap['Arquitectura']&&catMap['Arquitectura'].total>0)},
    {id: 'preset-6', titulo:'📢 Marketing Digital', categoria:'Marketing Digital', desc:'SEO, redes sociales y pauta. Mayor captación con menos esfuerzo.',precio:0,roi:40,riesgo:'baja',horizonte:'2-4 meses',accion:'Google Ads + Meta Ads + SEO local. Retorno 4x del invertido.',paretoBoost:true},
    {id: 'preset-7', titulo:'💻 Tecnología e IA', categoria:'Tecnología e IA', desc:'Automatización y herramientas que multiplican tu eficiencia.',precio:0,roi:50,riesgo:'baja',horizonte:'1-2 meses',accion:'Panel ICDE avanzado, automatizaciones e inteligencia artificial.',paretoBoost:true}
  ];

  // Merge custom investments with presets
  const allInversiones = [...customList, ...presets];

  // Calculate totals for custom items
  const totalCostoInversiones = customList.reduce((acc, x) => acc + (parseFloat(x.precio) || 0), 0);

  // Group costs by category
  const catCosts = {};
  customList.forEach(x => {
    const c = x.categoria || 'Otro';
    if (!catCosts[c]) catCosts[c] = 0;
    catCosts[c] += (parseFloat(x.precio) || 0);
  });

  const paretoHtml = 
    '<div id="contParetoChartsWrapper" style="display:'+(contMostrarParetoGraficas?'block':'none')+'; margin-bottom:20px;">'+
      '<div class="cont-panel">'+
        '<div class="cont-panel-header"><div class="cont-panel-title">⚖️ Análisis Pareto</div><span style="font-size:12px;color:var(--muted);">'+n80+' '+(n80===1?'categoría genera':'categorías generan')+' el 80%</span></div>'+
        '<div class="cont-panel-body">'+
        (totalIng===0?'<div class="cont-empty">Sin ingresos para analizar.</div>':
          '<div style="background:rgba(212,168,75,0.08);border:1px solid rgba(212,168,75,0.2);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;">🎯 <strong style="color:var(--gold);">Regla 80/20:</strong> <span style="color:#ccc;">Las <strong style="color:#fff;">'+n80+'</strong> categorías más rentables generan el <strong style="color:#22c55e;">80%</strong> de tus ingresos.</span></div>'+
          '<div class="cont-chart-wrap" style="height:280px;"><canvas id="chartPareto"></canvas></div>'+
          '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:16px;"><thead><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><th style="padding:8px 10px;text-align:left;color:var(--gold);font-size:10px;text-transform:uppercase;">Categoría</th><th style="padding:8px 10px;text-align:right;color:var(--gold);font-size:10px;text-transform:uppercase;">Ingresos</th><th style="padding:8px 10px;text-align:right;color:var(--gold);font-size:10px;text-transform:uppercase;">%</th><th style="padding:8px 10px;text-align:right;color:var(--gold);font-size:10px;text-transform:uppercase;">% Acum.</th><th style="padding:8px 10px;text-align:center;color:var(--gold);font-size:10px;text-transform:uppercase;">Impacto</th></tr></thead>'+
          '<tbody>'+pd.map(function(p){return'<tr style="border-bottom:1px solid rgba(255,255,255,0.03);background:'+(p.is80?'rgba(34,197,94,0.04)':'')+'"><td style="padding:8px 10px;color:#fff;font-weight:'+(p.is80?700:400)+';">'+(CONT_CAT_ICONS[p.cat]||'•')+' '+p.cat+'</td><td style="padding:8px 10px;text-align:right;color:#22c55e;font-weight:600;">'+contFmt(p.total)+'</td><td style="padding:8px 10px;text-align:right;color:#ccc;">'+p.pct.toFixed(1)+'%</td><td style="padding:8px 10px;text-align:right;color:'+(p.pctAcum<=80?'#22c55e':'#888')+';">'+p.pctAcum.toFixed(1)+'%</td><td style="padding:8px 10px;text-align:center;">'+(p.is80?'<span style="background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;">⭐ VITAL</span>':'<span style="color:#555;font-size:10px;">Complementario</span>')+'</td></tr>';}).join('')+'</tbody></table>')+'</div>'+
      '</div>'+
    '</div>';

  // Build category summary pills HTML
  const catPillsHtml = Object.entries(catCosts).map(([c, total]) => {
    return '<span style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:3px 10px; border-radius:12px; font-size:11px; color:#ddd;"><strong style="color:var(--gold);">' + c + ':</strong> $' + contFmt(total) + '</span>';
  }).join(' ');

  el.innerHTML=
  '<div style="background:linear-gradient(135deg,rgba(212,168,75,0.08),rgba(34,197,94,0.04));border:1px solid rgba(212,168,75,0.2);border-radius:14px;padding:18px 22px;margin-bottom:20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:space-between;">'+
    '<div style="display:flex;gap:16px;align-items:center;flex:1;">'+
      '<div style="font-size:28px;">🤖</div>'+
      '<div><div style="font-weight:700;color:var(--gold);font-size:15px;margin-bottom:4px;">Recomendaciones Análisis Pareto & Plan de Inversiones</div>'+
      '<div style="color:#ccc;font-size:13px;line-height:1.5;">Ingresos <strong style="color:#22c55e;">'+contFmt(totalIng)+'</strong> · Utilidad <strong style="color:'+(utilidad>=0?'#22c55e':'#ef4444')+'">'+contFmt(utilidad)+'</strong>'+(utilidad>0?' · Reinvertir hasta <strong style="color:var(--gold);">'+contFmt(montoPropuesto)+'</strong> (30%)':' · Optimiza gastos antes de invertir.')+' · Total Inversiones Planificadas: <strong style="color:var(--gold); font-weight:700;">$'+contFmt(totalCostoInversiones)+'</strong></div>'+
      (catPillsHtml ? '<div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">' + catPillsHtml + '</div>' : '')+
      '</div>'+
    '</div>'+
    '<div style="display:flex; gap:10px; align-items:center;">'+
      '<button onclick="contAbrirModalInversion(null)" style="background:var(--gold); border:none; color:#121212; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 6px rgba(0,0,0,0.4); transition:all 0.15s ease;" onmouseover="this.style.filter=\'brightness(1.15)\'" onmouseout="this.style.filter=\'\'">➕ Agregar Inversión</button>'+
      '<button onclick="contToggleParetoGraficas()" style="background:linear-gradient(180deg, #d9ac3b 0%, #9e751d 100%); border:1px solid #785614; color:#0f0f0f; font-size:12px; font-weight:700; font-family:system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; letter-spacing:0.2px; padding:6px 16px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 6px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.45); transition:all 0.15s ease;" onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'">📊 Gráficas</button>'+
    '</div>'+
  '</div>'+
  paretoHtml+
  '<div class="cont-pareto-grid">'+allInversiones.map(function(inv){
    const paretoEval = contCalcularConvenienciaPareto(inv, catMap, pd, totalIng);
    const precioNum = parseFloat(inv.precio) || 0;
    
    let viabilidadHtml = '';
    if (precioNum > 0) {
      if (montoPropuesto > 0) {
        if (precioNum <= montoPropuesto) {
          viabilidadHtml = '<span style="font-size:10px; color:#22c55e; background:rgba(34,197,94,0.1); padding:2px 8px; border-radius:12px; border:1px solid rgba(34,197,94,0.25); font-weight:600;">✅ Cubierto con reinversión del mes</span>';
        } else {
          const mesesNec = (precioNum / montoPropuesto).toFixed(1);
          viabilidadHtml = '<span style="font-size:10px; color:#f97316; background:rgba(249,115,22,0.1); padding:2px 8px; border-radius:12px; border:1px solid rgba(249,115,22,0.25); font-weight:600;">⏳ Requiere ~' + mesesNec + ' meses de utilidad</span>';
        }
      } else {
        viabilidadHtml = '<span style="font-size:10px; color:#888; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:12px;">Costo proyectado</span>';
      }
    }

    return '<div class="cont-inv-card" style="position:relative; display:flex; flex-direction:column; justify-content:space-between;">'+
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">'+
        '<div class="cont-inv-title" style="font-size:14px; font-weight:700; color:#fff;">'+(inv.titulo || inv.titulo)+ '</div>'+
        '<div style="display:flex; gap:4px; align-items:center;">'+
          '<span style="background:'+paretoEval.bg+'; color:'+paretoEval.color+'; border:1px solid '+paretoEval.border+'; padding:3px 9px; border-radius:20px; font-size:9px; font-weight:700; white-space:nowrap;">'+paretoEval.label+'</span>'+
          (inv.precio !== undefined ? '<button onclick="contAbrirModalInversion(\''+inv.id+'\')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--gold); cursor:pointer; font-size:11px; width:24px; height:24px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; transition:all 0.2s;" title="Editar o eliminar inversión" onmouseover="this.style.background=\'rgba(212,168,75,0.2)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\'">✏️</button>' : '')+
        '</div>'+
      '</div>'+

      (precioNum > 0 ? 
        '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:6px 10px; background:rgba(0,0,0,0.25); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">'+
          '<div><span style="font-size:10px; color:var(--muted); text-transform:uppercase;">Precio / Costo:</span> <strong style="font-size:15px; color:var(--gold); margin-left:4px;">$' + contFmt(precioNum) + '</strong></div>'+
          viabilidadHtml+
        '</div>' : '') +

      '<div class="cont-inv-desc" style="font-size:12px; color:#aaa; margin-bottom:10px; line-height:1.4;">'+(inv.accion || inv.desc || '')+'</div>'+
      
      '<div class="cont-inv-meta" style="margin-bottom:10px; display:flex; gap:6px; align-items:center; flex-wrap:wrap;">'+
        '<div class="cont-inv-badge '+(inv.riesgo||'baja')+'">Riesgo '+(inv.riesgo||'baja')+'</div>'+
        '<div class="cont-inv-badge media">⏱ '+(inv.horizonte||'1-2 meses')+'</div>'+
        '<div style="font-size:11px; color:#888; margin-left:auto;">Categoría: <strong style="color:#ccc;">'+(inv.categoria || 'General')+'</strong></div>'+
      '</div>'+

      '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05);">'+
        '<div class="cont-inv-roi">~'+(inv.roi||30)+'% <span style="font-size:10px; color:#888;">ROI estimado</span></div>'+
        (montoPropuesto>0?'<div style="font-size:11px;color:var(--muted);">Retorno est: <strong style="color:#22c55e;">$'+contFmt((precioNum || montoPropuesto)*((inv.roi||30)/100))+'</strong></div>':'')+
      '</div>'+
    '</div>';
  }).join('')+'</div>';

  if (contMostrarParetoGraficas) {
    setTimeout(function(){
      try {
        if(totalIng>0&&pd.length){const ctx=document.getElementById('chartPareto');if(ctx){const cols=pd.map(function(p){return p.is80?'rgba(34,197,94,0.75)':'rgba(100,100,100,0.45)';});contCharts['chartPareto']=new Chart(ctx,{type:'bar',data:{labels:pd.map(function(p){return p.cat;}),datasets:[{label:'Ingresos',data:pd.map(function(p){return p.total;}),backgroundColor:cols,borderWidth:1.5,borderRadius:5,order:2},{label:'% Acumulado',data:pd.map(function(p){return p.pctAcum;}),type:'line',borderColor:'#d4a84b',backgroundColor:'rgba(212,168,75,0.08)',borderWidth:2,pointRadius:4,tension:0.3,yAxisID:'y1',order:1}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.datasetIndex===0?' '+contFmt(ctx.raw):' '+ctx.raw.toFixed(1)+'%';}}}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#888',font:{size:10},maxRotation:30}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#888',font:{size:10},callback:function(v){return contFmt(v);}},beginAtZero:true},y1:{position:'right',min:0,max:100,grid:{display:false},ticks:{color:'#d4a84b',font:{size:10},callback:function(v){return v+'%';}}}}}});}}
      } catch (e) {
        console.warn("No se pudo cargar el gráfico de Pareto:", e);
      }
    },80);
  }
}

"""
    content = content[:start_idx] + new_code + content[end_idx:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully replaced contRenderInversiones and added custom investment logic!")
else:
    print("ERROR: Markers not found")
