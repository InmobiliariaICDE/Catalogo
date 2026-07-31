
let lbIdx = 0;
let lbFotos = [];

window.lbAbrir = function(fotos, idx){
  lbFotos = fotos;
  lbIdx = idx;
  document.getElementById('lightboxOverlay').classList.add('activo');
  
  const mins = document.getElementById('lightboxMins');
  mins.innerHTML = lbFotos.map((u,i)=>`<img src="${u}" class="lightbox-min ${i===lbIdx?'activa':''}" onclick="lbIr(${i})"/>`).join('');
  
  lbIr(lbIdx);
}

window.lbIr = function(idx){
  const n = lbFotos.length;
  if(n<=0) return;
  lbIdx = (idx + n) % n;
  
  const img = document.getElementById('lightboxImg');
  img.src = lbFotos[lbIdx];
  
  document.getElementById('lightboxCounter').textContent = `${lbIdx+1} / ${n}`;
  
  const mins = document.querySelectorAll('.lightbox-min');
  mins.forEach((m,i)=>m.classList.toggle('activa', i===lbIdx));
  if(mins[lbIdx]) mins[lbIdx].scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
}

window.lbCerrar = function(){
  document.getElementById('lightboxOverlay').classList.remove('activo');
}

document.addEventListener('keydown', e => {
  if(!document.getElementById('lightboxOverlay').classList.contains('activo')) return;
  if(e.key==='Escape') lbCerrar();
  if(e.key==='ArrowLeft') lbIr(lbIdx-1);
  if(e.key==='ArrowRight') lbIr(lbIdx+1);
});

function generarSlugPropiedad(inmueble) {
  const nombre = (inmueble["Nombre"] || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').substring(0, 60);
  const codigo = String(inmueble["Código"] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return nombre ? nombre + '-' + codigo : 'propiedad-' + codigo;
}

function compartirPropiedad(codigo, btn){
  const p = allProps.find(x=>x['Código']===codigo);
  if(!p) return;
  const url = 'https://icdeinmobiliaria.com/propiedad/' + generarSlugPropiedad(p) + '.html';
  
  navigator.clipboard.writeText(url).then(() => {
    toast('Enlace copiado ✓');
    if(btn){
      const original = btn.innerHTML;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Enlace copiado';
      btn.style.color = '#22c55e';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.color = '';
      }, 2000);
    }
  });
}

let mpCarruselFotos = [];
let mpCarruselIdx = 0;
let mpMapaInstance = null;
let mpMapaMarker = null;

function abrirModalProp(codigoOrProp){
  let p;
  let isPreview = false;
  if (typeof codigoOrProp === 'object') {
    p = codigoOrProp;
    isPreview = true;
  } else {
    p = allProps.find(x=>x['Código']===codigoOrProp);
  }
  if(!p) return;
  
  document.getElementById('mpTitle').textContent = p['Nombre'];
  document.getElementById('mpType').textContent = p['Tipo de inmueble'] || 'Inmueble';
  document.getElementById('mpCode').textContent = `Código: ${p['Código']}`;
  document.getElementById('mpPrice').textContent = formatFullPrice(p['Precio']);
  document.getElementById('mpDesc').textContent = p['Descripción'] || 'Sin descripción';
  document.getElementById('mpKeyPoints').textContent = p['Puntos Clave'] || 'No especificados';
  
  // Fotos
  mpCarruselFotos = (p['Imagenes']||'').split('|').map(u=>u.trim()).filter(u=>u.length>5);
  if(!mpCarruselFotos.length) mpCarruselFotos = [p['Image'] || 'https://i.imgur.com/Pc9M3I8.png'];
  
  mpCarruselInit();
  
  const tags = document.getElementById('mpTags');
  tags.innerHTML = '';
  if(p['Habitaciones']) tags.innerHTML += `<div class="modal-prop-tag"><img src="https://i.imgur.com/ykKdGwE.png" width="16"/> <strong>${p['Habitaciones']}</strong> Hab</div>`;
  if(p['Baños']) tags.innerHTML += `<div class="modal-prop-tag"><img src="https://i.imgur.com/h9NqA32.png" width="16"/> <strong>${p['Baños']}</strong> Baños</div>`;
  if(p['Garaje'] && p['Garaje']!=='No') tags.innerHTML += `<div class="modal-prop-tag"><img src="https://i.imgur.com/4Yixa77.png" width="16"/> <strong>${p['Garaje']}</strong> Garaje</div>`;
  if(p['Cocina'] && p['Cocina']!=='No') tags.innerHTML += `<div class="modal-prop-tag"><img src="https://i.imgur.com/rH6cXMa.png" width="16"/> <strong>Cocina</strong> ${p['Cocina']}</div>`;
  if(p['Pisos']) tags.innerHTML += `<div class="modal-prop-tag"><img src="https://img.icons8.com/ios-filled/50/ffffff/stairs.png" width="16"/> <strong>${p['Pisos']}</strong> Pisos</div>`;
  
  const specsTable = document.getElementById('mpSpecsTable');
  const items = [
    ['Ciudad', p['Ciudad']],
    ['Zona', p['Zona']],
    ['Comuna', p['Comuna']],
    ['Estrato', p['Estrato']],
    ['Ubicación', p['Ubicación']],
    ['Área construida', p['Área Construida'] || p['Área'] || p['area'] || ''],
    ['Área lote', p['Área lote']],
    ['Closets', p['Closet']],
    ['Cocina', p['Cocina']],
    ['Ascensor', p['Ascensor']],
    ['Número de Cortinas', p['Número de Cortinas']],
    ['Aire Acondicionado', p['Aire Acondicionado']],
    ['Reja Antejardín', p['Reja Antejardín']],
    ['Patio', p['Patio']],
    ['Piscina', p['Piscina']],
    ['Antigüedad', p['Antigüedad del Inmueble']],
    ['Dimensiones', p['Dimensiones']],
    ['Administración', p['Administración'] || p['Administracion'] || ''],
    ['Retorno de la inversión', p['Retorno de la inversión'] || p['Rentabilidad'] || p['rentabilidad'] || ''],
    ['Propietario', p['Nombre del Propietario']],
    ['Celular 1', p['Celular 1'] || p['Celulares']],
    ['Celular 2', p['Celular 2']],
    ['Cuánto Renta', p['Cuánto Renta ($)'] ? `$${Number(p['Cuánto Renta ($)']).toLocaleString('es-CO')}` : ''],
    ['Inventario', p['Inventario'] && String(p['Inventario']).trim() !== '' ? String(p['Inventario']).trim() : 'NO'],
    ['Inmobiliaria', p['Inmobiliaria'] || 'Directo'],
    ['Dirección', p['DIRECCIÓN'] || p['DIRECCIÒN-VEREDA'] || p['Ubicación'] || '']
  ];
  specsTable.innerHTML = items.map(([k,v]) => {
    const displayVal = (v !== undefined && v !== null && String(v).trim() !== '') ? String(v).trim() : '—';
    return `<tr><td>${k}</td><td>${displayVal}</td></tr>`;
  }).join('');
  
  const btnShare = document.querySelector('.modal-btn-compartir');
  if(btnShare) {
    if (isPreview) {
      btnShare.style.display = 'none';
    } else {
      btnShare.style.display = 'flex';
      btnShare.onclick = () => compartirPropiedad(p['Código'], btnShare);
    }
  }

  const btnEdit = document.querySelector('.btn-edit-prop');
  if(btnEdit) {
    if (isPreview) {
      btnEdit.style.display = 'none';
    } else {
      btnEdit.style.display = 'flex';
      btnEdit.onclick = () => { cerrarModalProp(); abrirEditorProp(p['Código']); };
    }
  }
  
  // Custom top banner for simulated preview
  let banner = document.getElementById('mpPreviewBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'mpPreviewBanner';
    banner.style.cssText = 'position:absolute; top:0; left:0; right:0; background:rgba(212,168,75,0.9); color:#000; text-align:center; padding:8px; font-weight:bold; font-size:12px; z-index:10000; letter-spacing:1px; text-transform:uppercase;';
    banner.textContent = 'Vista previa — aún no guardada';
    document.getElementById('modalPropOverlay').appendChild(banner);
  }
  banner.style.display = isPreview ? 'block' : 'none';
  
  document.getElementById('modalPropOverlay').classList.add('active');

  // Inicializar/Actualizar Mapa
  setTimeout(() => {
    initMpMapa(p);
  }, 300); // Esperar a que el modal sea visible
}

function initMpMapa(p) {
  const container = document.getElementById('mpMapa');
  const errorMsg = document.getElementById('mpMapaError');
  if(!container) return;

  let lat = parseFloat(String(p['Latitud'] || p['Lat'] || '').replace(',','.'));
  let lng = parseFloat(String(p['Longitud'] || p['Lng'] || '').replace(',','.'));

  if(isNaN(lat) || isNaN(lng) || lat === 0) {
    container.style.display = 'none';
    if(errorMsg) errorMsg.style.display = 'block';
    return;
  }

  container.style.display = 'block';
  if(errorMsg) errorMsg.style.display = 'none';

  if(!mpMapaInstance) {
    mpMapaInstance = L.map('mpMapa', { zoomControl: false }).setView([lat, lng], 16);
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20
    }).addTo(mpMapaInstance);
    L.control.zoom({ position: 'bottomright' }).addTo(mpMapaInstance);
  } else {
    mpMapaInstance.setView([lat, lng], 16);
    mpMapaInstance.invalidateSize();
  }

  if(mpMapaMarker) mpMapaInstance.removeLayer(mpMapaMarker);

  const price = p['Precio'] ? formatShortPrice(p['Precio']) : 'N/A';
  const icon = L.divIcon({
    className: 'z-marker-wrap',
    html: `<div class="z-marker active" style="transform: scale(1.2);">${price}</div>`,
    iconSize: [60, 25],
    iconAnchor: [30, 25]
  });

  mpMapaMarker = L.marker([lat, lng], { icon }).addTo(mpMapaInstance);

  // Update Street View thumbnail
  const svThumb = document.getElementById('mpStreetViewThumb');
  const svImg = document.getElementById('mpStreetViewImg');
  if (svThumb && svImg) {
    window._mpSvLat = lat;
    window._mpSvLng = lng;
    svImg.src = `https://maps.googleapis.com/maps/api/streetview?size=100x70&scale=2&location=${lat},${lng}&key=AIzaSyDoeGgX0VRgHY1wXjm4Z0SPZp9R4EBkUF0`;
    svImg.style.display = 'block';
    svThumb.style.display = 'block';
  }
}

function mpCarruselInit(){
  mpCarruselIdx = 0;
  const principal = document.getElementById('mpCarruselPrincipal');
  principal.querySelectorAll('.carrusel-slide').forEach(s=>s.remove());
  
  mpCarruselFotos.forEach((u,i)=>{
    const slide = document.createElement('div');
    slide.className = 'carrusel-slide' + (i===0?' activa':'');
    slide.innerHTML = `<img src="${u}" loading="lazy" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/>`;
    principal.insertBefore(slide, principal.querySelector('.carrusel-prev'));
  });
  
  const mini = document.getElementById('mpCarruselMiniaturas');
  mini.innerHTML = mpCarruselFotos.map((u,i)=>`<img src="${u}" class="carrusel-min ${i===0?'activa':''}" onclick="mpCarruselIrA(${i})"/>`).join('');
  
  document.getElementById('mpCarruselCounter').textContent = `1 / ${mpCarruselFotos.length}`;
}

function mpCarruselIr(delta){
  mpCarruselIrA(mpCarruselIdx + delta);
}

function mpCarruselIrA(idx){
  const n = mpCarruselFotos.length;
  if(n<=1) return;
  mpCarruselIdx = (idx + n) % n;
  
  const slides = document.querySelectorAll('#mpCarruselPrincipal .carrusel-slide');
  slides.forEach((s,i)=>s.classList.toggle('activa', i===mpCarruselIdx));
  
  const mins = document.querySelectorAll('#mpCarruselMiniaturas .carrusel-min');
  mins.forEach((m,i)=>m.classList.toggle('activa', i===mpCarruselIdx));
  if(mins[mpCarruselIdx]) mins[mpCarruselIdx].scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
  
  document.getElementById('mpCarruselCounter').textContent = `${mpCarruselIdx+1} / ${n}`;
}

function cerrarModalProp(){
  document.getElementById('modalPropOverlay').classList.remove('active');
  // No destruimos la instancia para reutilizarla, pero podemos limpiar el marcador si queremos
}
function updTimelineNota(leadId, idx, val) {
  const l = leads.find(x => String(x.id) === String(leadId));
  if (!l || !l.historialEnvios || !l.historialEnvios[idx]) return;
  l.historialEnvios[idx].notas = val;
  saveLeads();
  syncSheets(l);
  toast('Nota actualizada', 'success');
}

function sincronizarAliadosConPropiedades() {
  let aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  if (!Array.isArray(aliados)) aliados = [];
  
  // Limpiar las que se insertaron automáticamente por etiquetas en pruebas anteriores
  // También limpiar Finca Raíz, Metrocuadrado y Ciencuadras ya que el usuario no las quiere.
  const lenOriginal = aliados.length;
  aliados = aliados.filter(a => {
    if (!a || typeof a !== 'object') return false;
    if (a.notas === 'Autosincronizado desde propiedad') return false;
    if (['finca raiz', 'metrocuadrado', 'ciencuadras'].includes(norm(a.nombre))) return false;
    return true;
  });
  
  const LW_PARTNERS = [
    { nombre: "Elite Group", urlBase: "https://inmobiliariaelitegroupsas.com/", notas: "Carrusel Index" },
    { nombre: "Soluciones La Primavera", urlBase: "https://www.solucioneslaprimavera.com/", notas: "Carrusel Index" },
    { nombre: "Rocha Finca Raíz", urlBase: "https://rochafincaraiz.com/welcome/", notas: "Carrusel Index" },
    { nombre: "Inmobiliaria Jovel Muñoz", urlBase: "https://www.inmobiliariajovelmunoz.com.co/", notas: "Carrusel Index" },
    { nombre: "Inmobiliaria Santa María Vera", urlBase: "https://inmobiliariasantamariavera.com/", notas: "Carrusel Index" },
    { nombre: "MAC Negocios Inmobiliarios", urlBase: "https://web.facebook.com/people/MAC-negocios-Inmobiliarios/61581485549130/", notas: "Carrusel Index" },
    { nombre: "Inmobiliaria JP Escobar", urlBase: "https://www.inmobiliariajpescobar.com.co/", notas: "Carrusel Index" },
    { nombre: "Asuntos Inmobiliarios", urlBase: "https://www.facebook.com/figueroayasociadoshuila/?locale=es_LA", notas: "Carrusel Index" },
    { nombre: "Casa Honor Inmobiliaria", urlBase: "https://casahonorinmobiliaria.com/", notas: "Carrusel Index" },
    { nombre: "Rediis Armiento", urlBase: "https://www.instagram.com/rediisarmiento/", notas: "Carrusel Index" },
    { nombre: "Inmobiliaria Casa & Casa", urlBase: "https://casaycasainmobiliariadelhuila.com/", notas: "Carrusel Index" },
    { nombre: "Inmobiliaria Rustik House", urlBase: "https://inmobiliarianeiva.com/", notas: "Carrusel Index" },
    { nombre: "Menber", urlBase: "https://casasenventaneiva.com/", notas: "Carrusel Index" }
  ];

  const nombresExistentes = new Set(aliados.map(a => a && a.nombre ? norm(a.nombre) : ''));
  let updated = (aliados.length !== lenOriginal);

  LW_PARTNERS.forEach((p, idx) => {
    const n = norm(p.nombre);
    if (!nombresExistentes.has(n)) {
      nombresExistentes.add(n);
      aliados.push({
        id: 'ally_' + Date.now().toString() + '_' + idx,
        nombre: p.nombre,
        urlBase: p.urlBase,
        frecuenciaDias: 15,
        ultimoBarrido: '',
        notas: p.notas
      });
      updated = true;
    } else {
      const existing = aliados.find(a => norm(a.nombre) === n);
      if (existing && (!existing.urlBase || existing.notas === 'Autosincronizado desde propiedad')) {
        existing.urlBase = p.urlBase;
        existing.notas = p.notas;
        updated = true;
      }
    }
  });

  if (updated || !localStorage.getItem('icde_aliados_migrated')) {
    localStorage.setItem('icde_aliados', JSON.stringify(aliados));
    localStorage.setItem('icde_aliados_migrated', 'true');
  }
}

function renderGestion() {
  sincronizarAliadosConPropiedades();
  const c = document.getElementById('mainContent');
  if (!window.currentGestionSubTab) {
    window.currentGestionSubTab = 'nueva';
  }
  
  c.innerHTML = `
    <div class="section-header" style="margin-bottom: 20px;">
      <div class="section-title" style="display: flex; align-items: center; gap: 10px;">
        <span>🏠</span> Gestión de Inmuebles
      </div>
      <div class="sub-tabs" style="display: flex; gap: 10px;">
        <button class="btn ${window.currentGestionSubTab==='nueva'?'btn-primary':'btn-secondary'}" onclick="setGestionSubTab('nueva')">🏠 Nueva Propiedad</button>
        <button class="btn ${window.currentGestionSubTab==='barrido'?'btn-primary':'btn-secondary'}" onclick="setGestionSubTab('barrido')">📡 Barrido de Aliados</button>
        <button class="btn ${window.currentGestionSubTab==='aliados'?'btn-primary':'btn-secondary'}" onclick="setGestionSubTab('aliados')">👥 Gestión de Aliados</button>
      </div>
    </div>
    
    <div id="gestionAlerts"></div>
    <div id="gestionSubContent"></div>
  `;
  
  if (window.currentGestionSubTab === 'nueva') {
    renderNuevaPropiedad();
  } else if (window.currentGestionSubTab === 'barrido') {
    renderBarridoAliados();
  } else if (window.currentGestionSubTab === 'aliados') {
    renderGestionAliados();
  }
  
  checkOverdueSweepAlert();
}

function setGestionSubTab(subTab) {
  window.currentGestionSubTab = subTab;
  renderGestion();
}

/* SUB-TAB 1: NUEVA PROPIEDAD */
function renderNuevaPropiedad() {
  const sub = document.getElementById('gestionSubContent');
  const uniqueBarrios = Array.from(new Set(allProps.map(p => p['Barrio']).filter(Boolean)));
  const datalistHTML = `<datalist id="datalist_barrios">${uniqueBarrios.map(b => `<option value="${b}"></option>`).join('')}</datalist>`;
  
  sub.innerHTML = `
    ${datalistHTML}
    <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
        <div style="font-size: 16px; font-weight: 700; color: var(--gold);">📝 Registrar Nuevo Inmueble</div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="btn_gp_ia" onclick="gpAutoGenerarIA()">✨ Generar con IA</button>
        </div>
      </div>
      
      <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-bottom: 24px;">
        <div class="form-group" style="position:relative;"><label class="form-label">Código</label>
          <input class="form-input" id="gp_codigo" type="text" placeholder="Año + Secuencia (Auto-generar si está vacío)" oninput="validarCodigoExistente(this.value)"/>
          <span id="gp_codigo_msg" style="display:none; position:absolute; right:10px; bottom:-16px; font-size:11px; font-weight:600;"></span>
          
          <!-- Dropdown para autocompletar -->
          <div id="gp_codigo_dropdown" style="display:none; position:absolute; left:0; right:0; top:calc(100% + 2px); background:#141210; border:1px solid rgba(212,168,75,0.3); border-radius:10px; padding:0; z-index:100; box-shadow:0 10px 30px rgba(0,0,0,0.8); max-height:200px; overflow-y:auto;">
          </div>
        </div>
        <div class="form-group"><label class="form-label">Nombre *</label>
          <div style="display:flex; gap:6px;">
            <input class="form-input" id="gp_nombre" type="text" placeholder="Apartamento en barrio X" style="flex:1;"/>
            <button class="btn btn-secondary btn-sm" onclick="gpAutoGenerarNombre()" style="padding:0 8px;">Auto</button>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Tipo de inmueble *</label>
          <select class="form-input" id="gp_tipo">
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Local">Local</option>
            <option value="Lote">Lote</option>
            <option value="Bodega">Bodega</option>
            <option value="Finca">Finca</option>
            <option value="Oficina">Oficina</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Contrato *</label>
          <select class="form-input" id="gp_contrato">
            <option value="Directo">Directo</option>
            <option value="Aliado">Aliado</option>
            <option value="Verbal">Verbal</option>
            <option value="No Servicio">No Servicio</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Precio *</label><input class="form-input" id="gp_precio" type="text" placeholder="COP (Separador miles al escribir)" oninput="formatPrecioOnInput(this)"/></div>
        <div class="form-group" style="position:relative;"><label class="form-label">Barrio *</label>
          <input class="form-input" id="gp_barrio" type="text" list="datalist_barrios" placeholder="Barrio" onblur="autocompletarBarrio(this.value)"/>
          <span class="autofilled-msg" id="gp_barrio_msg" style="display:none; position:absolute; right:10px; bottom:-16px;"></span>
        </div>
        <div class="form-group"><label class="form-label">Conjunto / Edificio</label><input class="form-input" id="gp_conjunto" type="text" placeholder="Ej: Condominio Real"/></div>
        <div class="form-group"><label class="form-label">Zona</label>
          <select class="form-input" id="gp_zona">
            <option value="">Selecciona...</option>
            <option value="Centro">Centro</option>
            <option value="Norte">Norte</option>
            <option value="Occidente">Occidente</option>
            <option value="Oriente">Oriente</option>
            <option value="Rural">Rural</option>
            <option value="Sur">Sur</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Ciudad</label><input class="form-input" id="gp_ciudad" type="text" value="Cali"/></div>
        <div class="form-group"><label class="form-label">Estrato</label>
          <select class="form-input" id="gp_estrato">
            <option value="">Selecciona...</option>
            ${[1,2,3,4,5,6].map(e => `<option value="${e}">${e}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Dirección</label><input class="form-input" id="gp_ubicacion" type="text" placeholder="Dirección exacta"/></div>
        <div class="form-group"><label class="form-label">Habitaciones</label>
          <select class="form-input" id="gp_habitaciones">
            ${[1,2,3,4,5,'6+'].map(h => `<option value="${h}">${h}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Baños</label>
          <select class="form-input" id="gp_banos">
            ${[1,2,3,4,'5+'].map(b => `<option value="${b}">${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Garaje</label>
          <select class="form-input" id="gp_garaje">
            <option value="No">No</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3+">3+</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Cocina</label>
          <select class="form-input" id="gp_cocina">
            <option value="No">No</option>
            <option value="Integral">Integral</option>
            <option value="Semi-integral">Semi-integral</option>
            <option value="Tradicional">Tradicional</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Piscina</label>
          <select class="form-input" id="gp_piscina">
            <option value="No tiene">No tiene</option>
            <option value="Privada">Privada</option>
            <option value="Social">Social</option>
            <option value="Jacuzzi">Jacuzzi</option>
            <option value="Jacuzzi/Social">Jacuzzi/Social</option>
            <option value="Propia">Propia (Vieja)</option>
            <option value="Comunal">Comunal (Vieja)</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Pisos</label>
          <select class="form-input" id="gp_pisos">
            ${Array.from({length: 18}, (_, i) => '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + i + '</option>').join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Ubicación (Posición)</label>
          <select class="form-input" id="gp_ubicacion_posicion">
            <option value="Medianera">Medianera</option>
            <option value="Esquinera">Esquinera</option>
            <option value="Intermedia">Intermedia</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Google Fotos (Link Álbum)</label>
          <input class="form-input" id="gp_gfotos" type="text" placeholder="https://photos.app.goo.gl/..." oninput="debounceGFotosPreview(this.value)"/>
          <div id="gp_gfotos_preview" style="margin-top:10px;"></div>
        </div>
        <div class="form-group"><label class="form-label">Inmobiliaria / Aliado</label><input class="form-input" id="gp_inmobiliaria" type="text" placeholder="Dejar vacío para ICDE (Nativa)"/></div>
        <div class="form-group"><label class="form-label">Administración ($)</label><input class="form-input" id="gp_administracion" type="text" placeholder="Valor mensual" oninput="formatPrecioOnInput(this)"/></div>
        <div class="form-group"><label class="form-label">Retorno inversión (Rentabilidad)</label><input class="form-input" id="gp_rentabilidad" type="text" placeholder="Ej: 8% anual"/></div>
        
        <div class="form-group"><label class="form-label">Comuna</label>
          <select class="form-input" id="gp_comuna">
            ${Array.from({length: 11}, (_, i) => '<option value="' + i + '">' + i + '</option>').join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Área de Lote (m²)</label><input class="form-input" id="gp_area_lote" type="number" placeholder="m²"/></div>
        <div class="form-group"><label class="form-label">Área Construida (m²)</label><input class="form-input" id="gp_area" type="number" placeholder="m²"/></div>
        <div class="form-group"><label class="form-label">Clósets</label>
          <select class="form-input" id="gp_closets">
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Inventario</label>
          <select class="form-input" id="gp_inventario">
            <option value="NO">NO</option>
            <option value="Inventario">Inventario</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Celular 1</label><input class="form-input" id="gp_celulares" type="text" placeholder="Celular 1"/></div>
        <div class="form-group"><label class="form-label">Celular 2</label><input class="form-input" id="gp_celular_2" type="text" placeholder="Celular 2"/></div>
        <div class="form-group"><label class="form-label">Nombre del Propietario</label><input class="form-input" id="gp_propietario" type="text" placeholder="Propietario"/></div>
        <div class="form-group"><label class="form-label">Cuánto Renta ($)</label><input class="form-input" id="gp_renta" type="text" placeholder="Cuánto renta" oninput="formatPrecioOnInput(this)"/></div>
        <div class="form-group"><label class="form-label">Ascensor</label>
          <select class="form-input" id="gp_ascensor">
            <option value="NO">NO</option>
            <option value="SI">SI</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Número de Cortinas</label>
          <select class="form-input" id="gp_cortinas">
            <option value="0">0</option>
            <option value="NO">NO</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="SI">SI</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Aire Acondicionado</label>
          <select class="form-input" id="gp_aire_acondicionado">
            <option value="0">0</option>
            <option value="NO">NO</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="SI">SI</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Reja Antejardín</label>
          <select class="form-input" id="gp_reja_antejardin">
            <option value="NO">NO</option>
            <option value="SI">SI</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Antigüedad del Inmueble</label><input class="form-input" id="gp_antiguedad" type="text" placeholder="Ej: 5 años, Nuevo, Remodelado"/></div>
        <div class="form-group"><label class="form-label">Patio</label>
          <select class="form-input" id="gp_patio">
            <option value="0">0</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="G">G</option>
            <option value="M">M</option>
            <option value="P">P</option>
            <option value="A">A</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Dimensiones</label><input class="form-input" id="gp_dimensiones" type="text" placeholder="Ej: 7x12m"/></div>
        
        <div class="form-group"><label class="form-label">Latitud</label><input class="form-input" id="gp_lat" type="number" step="any" placeholder="3.3986"/></div>
        <div class="form-group"><label class="form-label">Longitud</label><input class="form-input" id="gp_lng" type="number" step="any" placeholder="-76.5321"/></div>
        
        <div class="form-group" style="display:flex; flex-direction:column; gap:8px; justify-content:center; background:rgba(255,255,255,0.02); padding:12px; border-radius:8px; border:1px solid var(--border);">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px;"><input type="checkbox" id="gp_destacada" style="transform: scale(1.1);"/> Destacada ⭐</label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px;"><input type="checkbox" id="gp_publicar" checked style="transform: scale(1.1);"/> Publicar en Web 👁️</label>
        </div>
        
        <div class="form-group full">
          <label class="form-label">Descripción *</label>
          <textarea class="form-input" id="gp_descripcion" style="min-height: 100px;" placeholder="Descripción completa del inmueble..."></textarea>
        </div>
        
        <div class="form-group full">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="form-label">Puntos Clave (Uno por línea)</label>
            <button class="btn btn-secondary btn-sm" id="btn_gp_pc_ia" onclick="gpGenerarPuntosClaveIA()" style="font-size:10px; padding:2px 6px;">✨ Extraer de Desc.</button>
          </div>
          <textarea class="form-input" id="gp_puntos_clave" style="min-height: 80px;" placeholder="Ej: Cocina integral americana&#10;Vista exterior al parque&#10;Dos garajes lineales cubiertos"></textarea>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
        <button class="btn btn-danger" onclick="resetNuevaPropForm()">❌ Cancelar / Limpiar</button>
        <button class="btn btn-secondary" onclick="gpVistaPrevia()">👁️ Vista Previa</button>
        <button class="btn btn-primary" id="btn_gp_guardar" onclick="guardarPropiedad()">💾 Guardar Propiedad</button>
      </div>
    </div>
  `;
  
  checkBorradorPropiedad();
}

function gpAutoGenerarNombre() {
  const tipo = document.getElementById('gp_tipo').value;
  const barrio = document.getElementById('gp_barrio').value;
  if (barrio) {
    document.getElementById('gp_nombre').value = `${tipo} en barrio ${barrio}`;
    toast('Nombre auto-generado ✓', 'success');
  } else {
    toast('Por favor escribe el barrio para generar el nombre', 'error');
  }
}

function autocompletarBarrio(barrioName) {
  if (!barrioName) return;
  const match = allProps.find(p => norm(p['Barrio']) === norm(barrioName));
  if (match) {
    const z = match['Zona'] || '';
    const c = match['Ciudad'] || 'Cali';
    const e = match['Estrato'] || '';
    
    const inputZona = document.getElementById('gp_zona');
    const inputCiudad = document.getElementById('gp_ciudad');
    const inputEstrato = document.getElementById('gp_estrato');
    
    let autofilled = false;
    if (inputZona && !inputZona.value) { inputZona.value = z; autofilled = true; }
    if (inputCiudad && (!inputCiudad.value || inputCiudad.value === 'Cali')) { inputCiudad.value = c; autofilled = true; }
    if (inputEstrato && !inputEstrato.value) { inputEstrato.value = e; autofilled = true; }
    
    if (autofilled) {
      const msg = document.getElementById('gp_barrio_msg');
      if (msg) {
        msg.style.display = 'inline-block';
        msg.textContent = '✓ autocompletado';
        setTimeout(() => { msg.style.display = 'none'; }, 4000);
      }
      toast('Datos de barrio autocompletados ✓', 'success');
    }
  }
}

function formatPrecioOnInput(el) {
  let val = el.value.replace(/[^\d]/g, "");
  if (val) {
    el.value = Number(val).toLocaleString('es-CO');
  } else {
    el.value = "";
  }
}

let icdeMatrixText = '';
let loadingMatrix = false;
window.currentMatchedProp = null;

async function validarCodigoExistente(codigo) {
  const msg = document.getElementById('gp_codigo_msg');
  const input = document.getElementById('gp_codigo');
  const dropdown = document.getElementById('gp_codigo_dropdown');
  
  if (!codigo) {
    if (msg) msg.style.display = 'none';
    if (input) input.style.borderColor = '';
    if (dropdown) dropdown.style.display = 'none';
    window.currentMatchedProp = null;
    return;
  }
  
  let exactMatch = null;
  
  // Buscar coincidencia exacta en allProps (Datos de Apps Script / Matriz), ignorando KMZ
  const propFromAllProps = allProps.find(p => {
    if (p.isKmzOnly) return false;
    const codeStr = String(p['Código'] || '').trim();
    if (codeStr.toLowerCase() === codigo.toLowerCase()) return true;
    if (!isNaN(codeStr) && !isNaN(codigo) && parseFloat(codeStr) === parseFloat(codigo)) return true;
    return false;
  });
  
  if (propFromAllProps) {
    exactMatch = {...propFromAllProps};
  }

  if (exactMatch) {
    window.currentMatchedProp = exactMatch;
    if (msg) {
      msg.style.display = 'inline-block';
      msg.style.color = '#ef4444';
      msg.textContent = '✕ Código ya existe';
    }
    if (input) input.style.borderColor = '#ef4444';
  } else {
    window.currentMatchedProp = null;
    if (msg) {
      msg.style.display = 'inline-block';
      msg.style.color = '#22c55e';
      msg.textContent = '✓ Disponible';
    }
    if (input) input.style.borderColor = '#22c55e';
  }

  // Filtrar sugerencias de inmuebles códigos que están en la matriz base de datos (excluyendo KMZ)
  const query = codigo.toLowerCase();
  const matches = allProps.filter(p => {
    if (p.isKmzOnly) return false;
    const codeStr = String(p['Código'] || '').trim().toLowerCase();
    return codeStr.includes(query);
  }).slice(0, 10);

  if (matches.length > 0) {
    if (dropdown) {
      dropdown.style.display = 'block';
      dropdown.innerHTML = matches.map(p => {
        const name = p['Nombre'] || 'Sin nombre';
        const barrio = p['Barrio'] || '';
        const zona = p['Zona'] || '';
        const code = p['Código'] || codigo;
        return `
          <div class="gp-cod-item" style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='rgba(212,168,75,0.1)'" onmouseout="this.style.background=''" onclick="autofillPropiedadPorCodigo('${eq(code)}')">
            <div>
              <span style="color:var(--gold); font-weight:700;">${code}</span> · ${name}
              <div style="font-size:11px; color:var(--muted); margin-top:2px;">${barrio}</div>
            </div>
            <div style="font-size:11px; color:rgba(255,255,255,0.5);">${zona}</div>
          </div>
        `;
      }).join('');
    }
  } else {
    if (dropdown) dropdown.style.display = 'none';
  }
}

// Ocultar dropdown de códigos al hacer clic fuera
document.addEventListener('click', function(e) {
  const gpCod = document.getElementById('gp_codigo');
  const gpDrop = document.getElementById('gp_codigo_dropdown');
  if (gpDrop && gpCod && !gpCod.contains(e.target) && !gpDrop.contains(e.target)) {
    gpDrop.style.display = 'none';
  }
});

function autofillPropiedadPorCodigo(selectedCode) {
  let p = null;
  if (selectedCode) {
    p = allProps.find(x => !x.isKmzOnly && String(x['Código'] || '').trim().toLowerCase() === String(selectedCode).trim().toLowerCase());
  } else {
    p = window.currentMatchedProp;
  }
  if (!p) return;
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (val === undefined || val === null) { el.value = ''; return; }
    el.value = val;
    // Si es un select y el valor no coincidió con ninguna opción, inyectarlo dinámicamente
    if (el.tagName === 'SELECT' && val && el.value !== val) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      el.appendChild(opt);
      el.value = val;
    }
  };
  const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
  
  setVal('gp_codigo', p['Código']);
  setVal('gp_nombre', p['Nombre'] || p['nombre']);
  setVal('gp_tipo', p['Tipo de inmueble'] || p['tipo'] || 'Apartamento');
  setVal('gp_contrato', p['Contrato'] || p['contrato'] || 'Directo');
  
  const precioEl = document.getElementById('gp_precio');
  const precioVal = p['Precio'] || p['precio'] || '';
  if (precioEl) {
    precioEl.value = precioVal;
    formatPrecioOnInput(precioEl);
  }
  
  setVal('gp_barrio', p['Barrio'] || p['barrio']);
  setVal('gp_conjunto', p['Conjunto'] || p['Conjunto / Edificio'] || p['conjunto'] || p['Edificio']);
  setVal('gp_zona', p['Zona'] || p['zona']);
  setVal('gp_ciudad', p['Ciudad'] || p['ciudad'] || 'Cali');
  setVal('gp_estrato', p['Estrato'] || p['estrato']);
  
  // Dirección exacta (Ubicación posicional es distinto)
  setVal('gp_ubicacion', p['DIRECCIÓN'] || p['Dirección'] || p['DIRECCIÒN-VEREDA'] || p['Dirección-Vereda'] || '');
  
  setVal('gp_habitaciones', p['Habitaciones'] || p['habitaciones'] || '1');
  setVal('gp_banos', p['Baños'] || p['banos'] || '1');
  setVal('gp_garaje', p['Garaje'] || p['garaje'] || 'No');
  setVal('gp_area', p['Área Construida'] || p['Área'] || p['Área (m²)'] || p['area'] || '');
  
  setVal('gp_cocina', p['Cocina'] || p['cocina'] || 'No');
  setVal('gp_piscina', p['Piscina'] || p['piscina'] || 'No tiene');
  setVal('gp_pisos', p['Pisos'] || p['pisos'] || '1');
  
  // Posición (Medianera, etc)
  setVal('gp_ubicacion_posicion', p['Ubicación'] || p['Ubicación (Posición)'] || p['Posición'] || 'Medianera');
  
  let gfLink = p['Google Fotos'] || '';
  console.log(`[Diagnostic Log] Autocompletando Google Fotos para inmueble ${selectedCode || p['Código']}. Valor en p['Google Fotos']: "${p['Google Fotos'] || ''}"`);
  if (!gfLink) {
    const possibleKeys = ['Google Fotos (Link Álbum)', 'googleFotos', 'Imagenes', 'Image'];
    for (const k of possibleKeys) {
      if (p[k] && typeof p[k] === 'string' && (p[k].includes('photos.app.goo.gl') || p[k].includes('photos.google.com'))) {
        gfLink = p[k];
        console.log(`[Diagnostic Log] Enlace de Google Fotos recuperado de la llave alternativa "${k}": "${gfLink}"`);
        break;
      }
    }
  }
  if (!gfLink) {
    console.warn(`[Diagnostic Log] ¡Advertencia! No se encontró un enlace de Google Fotos para este inmueble en ninguna llave. Llaves disponibles en el objeto del inmueble:`, Object.keys(p));
  } else {
    console.log(`[Diagnostic Log] Asignando enlace final de Google Fotos al input 'gp_gfotos': "${gfLink}"`);
  }
  setVal('gp_gfotos', gfLink);
  
  setVal('gp_inmobiliaria', p['Inmobiliaria'] || p['Inmobiliaria / Aliado'] || p['inmobiliaria'] || p['Inmob'] || '');
  setVal('gp_administracion', p['Administración'] || p['Administración ($)'] || p['administracion']);
  setVal('gp_rentabilidad', p['Retorno de la Inversión'] || p['Retorno de la inversión'] || p['Retorno inversión (Rentabilidad)'] || p['rentabilidad']);
  
  setVal('gp_comuna', p['Comuna'] || p['comuna'] || '');
  setVal('gp_area_lote', p['Área lote'] || p['Área de lote'] || p['areaLote'] || '');
  setVal('gp_closets', p['Closet'] || p['Closets'] || p['closet'] || '0');
  setVal('gp_inventario', p['Inventario'] || p['inventario'] || 'NO');
  setVal('gp_celulares', p['Celular 1'] || p['Celulares'] || p['celulares'] || '');
  setVal('gp_celular_2', p['Celular 2'] || p['celular 2'] || p['celular_2'] || '');
  setVal('gp_propietario', p['Nombre del Propietario'] || p['propietario'] || p['Nombre del propietario'] || p['PROPIETARIO'] || '');
  
  const rentaEl = document.getElementById('gp_renta');
  if (rentaEl) {
    // A veces Rentabilidad contiene el valor en pesos
    let rentaStr = p['Cuánto Renta ($)'] || p['renta'] || p['Cuánto renta'] || '';
    if (!rentaStr && p['Rentabilidad'] && p['Rentabilidad'].toLowerCase().includes('rentabilidad')) {
      rentaStr = p['Rentabilidad'].replace(/[^\d]/g, '');
    }
    rentaEl.value = rentaStr;
    formatPrecioOnInput(rentaEl);
  }
  
  setVal('gp_ascensor', p['Ascensor'] || p['ascensor'] || 'NO');
  setVal('gp_cortinas', p['Número de Cortinas'] || p['cortinas'] || '0');
  setVal('gp_aire_acondicionado', p['Aire Acondicionado'] || p['aire_acondicionado'] || p['Aire acondicionado'] || '');
  setVal('gp_reja_antejardin', p['Reja Antejardín'] || p['rejaAntejardin'] || 'NO');
  setVal('gp_antiguedad', p['Antigüedad del Inmueble'] || p['Antigüedad'] || p['antiguedad'] || p['Antiguedad del Inmueble'] || '');
  setVal('gp_patio', p['Patio'] || p['patio'] || 'NO');
  console.log(`[Diagnostic Log] Autocompletando Dimensiones para inmueble ${selectedCode || p['Código']}. Valor en p['Dimensiones']: "${p['Dimensiones'] || ''}"`);
  setVal('gp_dimensiones', p['Dimensiones'] || p['dimensiones'] || '');
  
  setVal('gp_lat', p['Latitud'] || p['latitud'] || p['Lat']);
  setVal('gp_lng', p['Longitud'] || p['longitud'] || p['Lng']);
  setVal('gp_descripcion', p['Descripción'] || p['descripcion']);
  
  const pcEl = document.getElementById('gp_puntos_clave');
  if (pcEl) {
    let pc = p['Puntos Clave'] || p['puntosClave'] || '';
    if (Array.isArray(pc)) pc = pc.join('\n');
    pcEl.value = pc;
  }
  
  const dest = p['Destacada'] || p['destacada'];
  setChecked('gp_destacada', dest === 'SI' || dest === true || dest === 'true');
  
  const pub = p['Publicar en Web'] || p['publicar'];
  setChecked('gp_publicar', pub !== 'NO' && pub !== false && pub !== 'false');
  
  const dropdown = document.getElementById('gp_codigo_dropdown');
  if (dropdown) dropdown.style.display = 'none';
  
  // Como ya existe en allProps, actualizamos el estado visual de validación a "Código ya existe"
  const msg = document.getElementById('gp_codigo_msg');
  const input = document.getElementById('gp_codigo');
  if (msg) {
    msg.style.display = 'inline-block';
    msg.style.color = '#ef4444';
    msg.textContent = '✕ Código ya existe';
  }
  if (input) input.style.borderColor = '#ef4444';
  
  const btnGuardar = document.getElementById('btn_gp_guardar');
  if (btnGuardar) {
    btnGuardar.innerHTML = '💾 Actualizar Propiedad';
  }
  
  // Guardar en variable global para que el botón de Guardar actúe como actualizar
  window.currentMatchedProp = {...p};
  
  toast('Datos cargados para editar ✓', 'success');
}

function resetNuevaPropForm() {
  const ids = [
    'gp_codigo', 'gp_nombre', 'gp_tipo', 'gp_contrato', 'gp_precio', 'gp_barrio', 'gp_conjunto', 'gp_zona', 'gp_ciudad', 'gp_estrato', 'gp_ubicacion', 'gp_habitaciones', 'gp_banos', 'gp_garaje', 'gp_area', 'gp_gfotos', 'gp_inmobiliaria', 'gp_administracion', 'gp_rentabilidad', 'gp_lat', 'gp_lng', 'gp_descripcion', 'gp_puntos_clave',
    'gp_comuna', 'gp_area_lote', 'gp_closets', 'gp_inventario', 'gp_celulares', 'gp_propietario', 'gp_renta', 'gp_ascensor', 'gp_cortinas', 'gp_aire_acondicionado', 'gp_reja_antejardin', 'gp_antiguedad', 'gp_patio', 'gp_dimensiones'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'gp_tipo') el.value = 'Apartamento';
      else if (id === 'gp_contrato') el.value = 'Directo';
      else if (id === 'gp_ciudad') el.value = 'Cali';
      else if (['gp_closets', 'gp_cortinas'].includes(id)) el.value = '0';
      else if (['gp_inventario', 'gp_ascensor', 'gp_reja_antejardin', 'gp_patio'].includes(id)) el.value = 'NO';
      else el.value = '';
    }
  });
  
  const checks = ['gp_destacada', 'gp_publicar'];
  checks.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = (id === 'gp_publicar');
  });
  
  const msg = document.getElementById('gp_codigo_msg');
  if (msg) msg.style.display = 'none';
  
  const input = document.getElementById('gp_codigo');
  if (input) input.style.borderColor = '';
  
  const dropdown = document.getElementById('gp_codigo_dropdown');
  if (dropdown) dropdown.style.display = 'none';
  
  const btnGuardar = document.getElementById('btn_gp_guardar');
  if (btnGuardar) btnGuardar.innerHTML = '💾 Guardar Propiedad';
  
  const preview = document.getElementById('gp_gfotos_preview');
  if (preview) preview.innerHTML = '';
  
  window.currentMatchedProp = null;
  
  toast('Formulario limpiado ✓', 'success');
}

/* DRAFT SAVE & RESTORE */
function getNuevaPropData() {
  return {
    codigo: document.getElementById('gp_codigo')?.value || '',
    nombre: document.getElementById('gp_nombre')?.value || '',
    tipo: document.getElementById('gp_tipo')?.value || '',
    contrato: document.getElementById('gp_contrato')?.value || '',
    precio: document.getElementById('gp_precio')?.value || '',
    barrio: document.getElementById('gp_barrio')?.value || '',
    conjunto: document.getElementById('gp_conjunto')?.value || '',
    zona: document.getElementById('gp_zona')?.value || '',
    ciudad: document.getElementById('gp_ciudad')?.value || '',
    estrato: document.getElementById('gp_estrato')?.value || '',
    ubicacion: document.getElementById('gp_ubicacion')?.value || '',
    habitaciones: document.getElementById('gp_habitaciones')?.value || '',
    banos: document.getElementById('gp_banos')?.value || '',
    garaje: document.getElementById('gp_garaje')?.value || '',
    pisos: document.getElementById('gp_pisos')?.value || '',
    area: document.getElementById('gp_area')?.value || '',
    piscina: document.getElementById('gp_piscina')?.value || '',
    cocina: document.getElementById('gp_cocina')?.value || '',
    administracion: document.getElementById('gp_administracion')?.value || '',
    rentabilidad: document.getElementById('gp_rentabilidad')?.value || '',
    descripcion: document.getElementById('gp_descripcion')?.value || '',
    puntos_clave: document.getElementById('gp_puntos_clave')?.value || '',
    lat: document.getElementById('gp_lat')?.value || '',
    lng: document.getElementById('gp_lng')?.value || '',
    gfotos: document.getElementById('gp_gfotos')?.value || '',
    destacada: document.getElementById('gp_destacada')?.checked || false,
    publicar: document.getElementById('gp_publicar')?.checked || false,
    inmobiliaria: document.getElementById('gp_inmobiliaria')?.value || '',
    ubicacion_posicion: document.getElementById('gp_ubicacion_posicion')?.value || 'Medianera',
    
    comuna: document.getElementById('gp_comuna')?.value || '',
    area_lote: document.getElementById('gp_area_lote')?.value || '',
    closets: document.getElementById('gp_closets')?.value || '0',
    inventario: document.getElementById('gp_inventario')?.value || 'NO',
    celulares: document.getElementById('gp_celulares')?.value || '',
    celular_2: document.getElementById('gp_celular_2')?.value || '',
    propietario: document.getElementById('gp_propietario')?.value || '',
    renta: document.getElementById('gp_renta')?.value || '',
    ascensor: document.getElementById('gp_ascensor')?.value || 'NO',
    cortinas: document.getElementById('gp_cortinas')?.value || '0',
    aire_acondicionado: document.getElementById('gp_aire_acondicionado')?.value || '',
    reja_antejardin: document.getElementById('gp_reja_antejardin')?.value || 'NO',
    antiguedad: document.getElementById('gp_antiguedad')?.value || '',
    patio: document.getElementById('gp_patio')?.value || 'NO',
    dimensiones: document.getElementById('gp_dimensiones')?.value || ''
  };
}

function saveBorradorPropiedad() {
  if (window.currentGestionSubTab !== 'nueva') return;
  const data = getNuevaPropData();
  const hasContent = Object.values(data).some(v => v !== '' && v !== false && v !== 'Cali' && v !== 'Apartamento' && v !== 'Venta' && v !== '1' && v !== 'No' && v !== 'NO' && v !== '0');
  if (hasContent) {
    const draft = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem('icde_borrador_propiedad', JSON.stringify(draft));
    console.log('Borrador auto-guardado.');
  }
}

function checkBorradorPropiedad() {
  const draftStr = localStorage.getItem('icde_borrador_propiedad');
  if (!draftStr) return;
  try {
    const draft = JSON.parse(draftStr);
    const age = Date.now() - draft.timestamp;
    if (age < 24 * 60 * 60 * 1000) {
      const date = new Date(draft.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString();
      
      const banner = document.getElementById('gestionAlerts');
      if (banner) {
        banner.innerHTML = `
          <div class="draft-banner" style="background: rgba(212,168,75,0.12); border: 1px solid var(--gold); border-radius: 12px; padding: 15px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; animation: slideIn 0.3s ease;">
            <div style="font-size: 13px;">
              📝 Hay un borrador guardado el <strong>${dateStr}</strong> a las <strong>${timeStr}</strong>. ¿Deseas recuperarlo?
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="recuperarBorradorPropiedad()">Recuperar</button>
              <button class="btn btn-secondary btn-sm" onclick="descartarBorradorPropiedad()">Descartar</button>
            </div>
          </div>
        `;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function recuperarBorradorPropiedad() {
  const draftStr = localStorage.getItem('icde_borrador_propiedad');
  if (!draftStr) return;
  try {
    const draft = JSON.parse(draftStr);
    poblarNuevaPropForm(draft.data);
    descartarBorradorPropiedad(true);
    toast('Borrador recuperado con éxito ✓', 'success');
  } catch (e) {
    console.error(e);
  }
}

function descartarBorradorPropiedad(onlyVisual = false) {
  if (!onlyVisual) {
    localStorage.removeItem('icde_borrador_propiedad');
  }
  const banner = document.getElementById('gestionAlerts');
  if (banner) banner.innerHTML = '';
}

function poblarNuevaPropForm(data) {
  if (!data) return;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
  
  setVal('gp_codigo', data.codigo);
  setVal('gp_nombre', data.nombre);
  setVal('gp_tipo', data.tipo);
  setVal('gp_contrato', data.contrato);
  setVal('gp_precio', data.precio);
  setVal('gp_barrio', data.barrio);
  setVal('gp_conjunto', data.conjunto);
  setVal('gp_zona', data.zona);
  setVal('gp_ciudad', data.ciudad);
  setVal('gp_estrato', data.estrato);
  setVal('gp_ubicacion', data.ubicacion);
  setVal('gp_habitaciones', data.habitaciones);
  setVal('gp_banos', data.banos);
  setVal('gp_garaje', data.garaje);
  setVal('gp_pisos', data.pisos || '1');
  setVal('gp_area', data.area);
  setVal('gp_piscina', data.piscina);
  setVal('gp_cocina', data.cocina);
  setVal('gp_administracion', data.administracion);
  setVal('gp_rentabilidad', data.rentabilidad);
  setVal('gp_descripcion', data.descripcion);
  setVal('gp_puntos_clave', data.puntos_clave);
  setVal('gp_lat', data.lat);
  setVal('gp_lng', data.lng);
  setVal('gp_gfotos', data.gfotos);
  setCheck('gp_destacada', data.destacada);
  setCheck('gp_publicar', data.publicar);
  setVal('gp_inmobiliaria', data.inmobiliaria);
  setVal('gp_ubicacion_posicion', data.ubicacion_posicion || 'Medianera');
  
  setVal('gp_comuna', data.comuna || '');
  setVal('gp_area_lote', data.area_lote || '');
  setVal('gp_closets', data.closets || '0');
  setVal('gp_inventario', data.inventario || 'NO');
  setVal('gp_celulares', data.celulares || '');
  setVal('gp_propietario', data.propietario || '');
  setVal('gp_renta', data.renta || '');
  setVal('gp_ascensor', data.ascensor || 'NO');
  setVal('gp_cortinas', data.cortinas || '0');
  setVal('gp_aire_acondicionado', data.aire_acondicionado || '');
  setVal('gp_reja_antejardin', data.reja_antejardin || 'NO');
  setVal('gp_antiguedad', data.antiguedad || '');
  setVal('gp_patio', data.patio || 'NO');
  setVal('gp_dimensiones', data.dimensiones || '');
  
  if (data.gfotos) {
    debounceGFotosPreview(data.gfotos);
  }
}

/* GOOGLE PHOTOS PREVIEW ALBUM (FASE 7) */
let gphotosTimeout = null;
function debounceGFotosPreview(url) {
  clearTimeout(gphotosTimeout);
  gphotosTimeout = setTimeout(() => {
    gpPreviewPhotos(url);
  }, 800);
}

async function gpPreviewPhotos(url) {
  const container = document.getElementById('gp_gfotos_preview');
  if (!container) return;
  
  if (!url || !url.startsWith('http')) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = '<div style="font-size:12px; color:var(--gold);"><span class="spinner" style="display:inline-block; width:10px; height:10px; border:2px solid var(--gold); border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:6px;"></span> Cargando fotos del álbum...</div>';
  
  try {
    const proxiedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxiedUrl);
    const data = await res.json();
    const html = data.contents;
    
    const imgRegex = /"https:\/\/(?:lh[3-6]\.googleusercontent\.com|lh[3-6]\.gpht\.com)\/[a-zA-Z0-9_-]+"/g;
    const matches = html.match(imgRegex) || [];
    const uniqueImgs = Array.from(new Set(matches.map(m => m.replace(/"/g, ''))))
      .filter(img => !img.includes('placeholder') && !img.includes('profile'));
      
    if (uniqueImgs.length > 0) {
      const thumbs = uniqueImgs.slice(0, 3);
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
          <div style="font-size: 11px; color: #22c55e;">✓ Enlace verificado. Fotos extraídas con éxito:</div>
          <div style="display: flex; gap: 8px;">
            ${thumbs.map(t => `<img src="${t}=w120-h90-c" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);" onerror="this.style.display='none'"/>`).join('')}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = '<div style="font-size: 11px; color: var(--muted);">Vista previa no disponible — el enlace se guardará igual</div>';
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div style="font-size: 11px; color: var(--muted);">Vista previa no disponible — el enlace se guardará igual</div>';
  }
}

/* GEMINI AI CORE GENERATION (FASE 3) */
async function gpAutoGenerarIA() {
  if (!settings.geminiKey) {
    toast('Por favor configura tu API Key de IA en Configuración ⚙️', 'error');
    return;
  }
  
  const tipo = document.getElementById('gp_tipo').value;
  const contrato = document.getElementById('gp_contrato').value;
  const precio = document.getElementById('gp_precio').value;
  const barrio = document.getElementById('gp_barrio').value;
  const zona = document.getElementById('gp_zona').value;
  const ciudad = document.getElementById('gp_ciudad').value;
  const habs = document.getElementById('gp_habitaciones').value;
  const banos = document.getElementById('gp_banos').value;
  const garaje = document.getElementById('gp_garaje').value;
  const area = document.getElementById('gp_area').value;
  
  if (!tipo || !precio || !barrio) {
    toast('Llena Tipo, Precio y Barrio para generar con IA', 'error');
    return;
  }
  
  const currentNombre = document.getElementById('gp_nombre').value;
  const currentDesc = document.getElementById('gp_descripcion').value;
  if (currentNombre || currentDesc) {
    if (!confirm('¿Quieres sobrescribir el Nombre, Descripción y Puntos Clave actuales con IA?')) {
      return;
    }
  }
  
  const btn = document.getElementById('btn_gp_ia');
  const btnText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner" style="display:inline-block; width:10px; height:10px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:4px;"></span> Generando...`;
  btn.disabled = true;
  
  const prompt = `Eres un redactor inmobiliario profesional para el mercado colombiano. A partir de los siguientes datos, genera en formato JSON puro (sin bloques de código \`\`\`json, sin markdown, solo el JSON directo):
  {
    "nombre": "Título profesional, atractivo y comercial del inmueble (ej: 'Espectacular Apartamento en barrio El Ingenio').",
    "descripcion": "Descripción persuasiva, vendedora y atractiva del inmueble, resaltando los espacios. Mínimo 150 palabras.",
    "puntosClave": ["Característica 1", "Característica 2", "Característica 3", "Característica 4", "Característica 5"]
  }
  
  Datos del inmueble:
  - Tipo de inmueble: ${tipo}
  - Contrato: ${contrato}
  - Precio: ${precio} COP
  - Barrio: ${barrio}
  - Zona: ${zona}
  - Ciudad: ${ciudad}
  - Habitaciones: ${habs}
  - Baños: ${banos}
  - Garajes: ${garaje}
  - Área: ${area} m²`;
  
  try {
    let text = await callAIEngine(prompt);
    text = text.replace(/```json|```/g, '').trim();
    
    const result = JSON.parse(text);
    
    async function typeWriter(elementId, fullText, delay = 10) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.value = "";
      for (let i = 0; i < fullText.length; i++) {
        el.value += fullText[i];
        el.dispatchEvent(new Event('input'));
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    await typeWriter('gp_nombre', result.nombre, 15);
    await typeWriter('gp_descripcion', result.descripcion, 4);
    
    const keyPointsText = (result.puntosClave || []).join('\n');
    await typeWriter('gp_puntos_clave', keyPointsText, 10);
    
    toast('¡Propiedad generada con éxito con IA! ✓', 'success');
  } catch (e) {
    console.error(e);
    toast('Error generando con IA', 'error');
  } finally {
    btn.innerHTML = btnText;
    btn.disabled = false;
  }
}

async function gpGenerarPuntosClaveIA() {
  if (!settings.geminiKey) {
    toast('Por favor configura tu API Key de IA en Configuración ⚙️', 'error');
    return;
  }
  
  const desc = document.getElementById('gp_descripcion').value;
  if (!desc) {
    toast('Escribe una descripción primero para extraer puntos clave', 'error');
    return;
  }
  
  const btn = document.getElementById('btn_gp_pc_ia');
  const btnText = btn.innerHTML;
  btn.innerHTML = `Generando...`;
  btn.disabled = true;
  
  const prompt = `Analiza la siguiente descripción de un inmueble en Colombia y extrae exactamente entre 4 y 6 puntos clave o características destacadas de una línea cada una (ej: 'Cocina integral con mesón de granito', 'Ubicación privilegiada cerca a centros comerciales'). Responde UNICAMENTE con un array JSON de strings (ej: ["Punto 1", "Punto 2", ...]). Sin markdown ni bloques de código.
  
  Descripción:
  "${desc}"`;
  
  try {
    let text = await callAIEngine(prompt);
    text = text.replace(/```json|```/g, '').trim();
    
    const result = JSON.parse(text);
    
    async function typeWriter(elementId, fullText, delay = 10) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.value = "";
      for (let i = 0; i < fullText.length; i++) {
        el.value += fullText[i];
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    await typeWriter('gp_puntos_clave', result.join('\n'), 15);
    toast('Puntos clave generados con éxito ✓', 'success');
  } catch (e) {
    console.error(e);
    toast('Error al extraer puntos clave', 'error');
  } finally {
    btn.innerHTML = btnText;
    btn.disabled = false;
  }
}

/* CATALOG PREVIEW (FASE 9) */
function gpVistaPrevia() {
  const data = getNuevaPropData();
  const codigo = data.codigo;
  
  // Si el código ya existe en el catálogo (allProps), mostramos el modal REAL
  if (codigo) {
    const propReal = allProps.find(p => {
      const codeStr = String(p['Código'] || '').trim();
      if (codeStr.toLowerCase() === codigo.toLowerCase()) return true;
      if (!isNaN(codeStr) && !isNaN(codigo) && parseFloat(codeStr) === parseFloat(codigo)) return true;
      return false;
    });
    
    if (propReal) {
      // Usamos la función oficial del catálogo pasándole el código
      abrirModalProp(propReal['Código']);
      return;
    }
  }
  
  // Si es un inmueble nuevo que no está en el catálogo, mantenemos la simulación
  const propSimulada = {
    'Código': data.codigo || 'PREVIEW',
    'Nombre': data.nombre || 'Simulación de Propiedad',
    'Tipo de inmueble': data.tipo || 'Apartamento',
    'Contrato': data.contrato || 'Directo',
    'Precio': data.precio ? data.precio.replace(/[^\d]/g, "") : '0',
    'Barrio': data.barrio || 'El Ingenio',
    'Conjunto': data.conjunto || '',
    'Zona': data.zona || '',
    'Ciudad': data.ciudad || 'Cali',
    'Estrato': data.estrato || '',
    'Ubicación': data.ubicacion || '',
    'Habitaciones': data.habitaciones || '3',
    'Baños': data.banos || '2',
    'Garaje': data.garaje || 'No',
    'Cocina': data.cocina || 'No',
    'Piscina': data.piscina || 'No',
    'Área': data.area || '',
    'Área Construida': data.area || '',
    'Administración': data.administracion || '',
    'Retorno de la inversión': data.rentabilidad || '',
    'Descripción': data.descripcion || '',
    'Puntos Clave': data.puntos_clave || '',
    'Latitud': data.lat || '3.3986',
    'Longitud': data.lng || '-76.5321',
    'Imagenes': '',
    'Inmobiliaria': data.inmobiliaria || 'ICDE',
    
    'Comuna': data.comuna || '',
    'Área lote': data.area_lote || '',
    'Closet': data.closets || '0',
    'Inventario': data.inventario || 'NO',
    'Celular 1': data.celulares || '',
    'Celular 2': data.celular_2 || '',
    'Celulares': data.celulares || '',
    'Nombre del Propietario': data.propietario || '',
    'Cuánto Renta ($)': data.renta ? data.renta.replace(/[^\d]/g, "") : '',
    'Ascensor': data.ascensor || 'NO',
    'Número de Cortinas': data.cortinas || '0',
    'Aire Acondicionado': data.aire_acondicionado || '',
    'Reja Antejardín': data.reja_antejardin || 'NO',
    'Antigüedad del Inmueble': data.antiguedad || '',
    'Patio': data.patio || 'NO',
    'Dimensiones': data.dimensiones || ''
  };
  
  const previewDiv = document.getElementById('gp_gfotos_preview');
  if (previewDiv) {
    const imgs = Array.from(previewDiv.querySelectorAll('img')).map(img => img.src.split('=')[0]);
    if (imgs.length > 0) {
      propSimulada['Imagenes'] = imgs.join('|');
    }
  }
  
  abrirModalProp(propSimulada);
}

/* DUPLICATE DETECTOR (FASE 6) */
function calcularDuplicado(newProp) {
  let matchedProp = null;
  let maxScore = 0;
  
  const newPrice = parseP(newProp['Precio']);
  const newBarrio = norm(newProp['Barrio']);
  const newArea = parseFloat(newProp['Área']) || 0;
  const newRooms = String(newProp['Habitaciones'] || '').trim();
  
  for (let p of allProps) {
    let score = 0;
    if (newBarrio && norm(p['Barrio']) === newBarrio) score += 1;
    
    const pPrice = parseP(p['Precio']);
    if (newPrice > 0 && pPrice > 0) {
      const diff = Math.abs(newPrice - pPrice) / pPrice;
      if (diff <= 0.15) score += 1;
    }
    
    const pArea = parseFloat(p['Área'] || p['Área Construida']) || 0;
    if (newArea > 0 && pArea > 0) {
      const diff = Math.abs(newArea - pArea) / pArea;
      if (diff <= 0.10) score += 1;
    }
    
    const pRooms = String(p['Habitaciones'] || '').trim();
    if (newRooms && pRooms === newRooms) score += 1;
    
    if (score > maxScore) {
      maxScore = score;
      matchedProp = p;
    }
  }
  
  return { score: maxScore, prop: matchedProp };
}

function showDuplicateModal(newProp, oldProp, onConfirm) {
  let modal = document.getElementById('duplicateWarningModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'duplicateWarningModal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '20000';
    document.body.appendChild(modal);
  }
  
  const formatP = v => Number(v).toLocaleString('es-CO');
  
  modal.innerHTML = `
    <div class="modal-box large" style="border: 2px solid var(--orange); animation: zoomIn 0.3s ease;">
      <div class="modal-title" style="color: var(--orange); display: flex; align-items: center; gap: 10px;">
        ⚠️ Alerta: Posible Propiedad Duplicada Detectada
      </div>
      <p style="font-size: 13.5px; color: var(--muted); margin-bottom: 20px;">
        Hemos encontrado una propiedad existente muy similar en la base de datos. Por favor compara antes de proceder:
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 12px; border: 1px solid var(--border);">
          <h4 style="color: var(--gold); margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">Nueva Propiedad</h4>
          <table style="width: 100%; font-size: 12.5px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Código</td><td>${newProp['Código'] || '(Auto-generado)'}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Tipo</td><td>${newProp['Tipo de inmueble']}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Barrio</td><td>${newProp['Barrio']}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Precio</td><td>$${formatP(newProp['Precio'])}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Área</td><td>${newProp['Área']} m²</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Habs / Baños</td><td>${newProp['Habitaciones']} / ${newProp['Baños']}</td></tr>
          </table>
        </div>
        <div style="background: rgba(212,168,75,0.03); padding: 16px; border-radius: 12px; border: 1px solid rgba(212,168,75,0.2);">
          <h4 style="color: var(--gold); margin-bottom: 12px; border-bottom: 1px solid rgba(212,168,75,0.1); padding-bottom: 6px;">Propiedad Existente (${oldProp['Código']})</h4>
          <table style="width: 100%; font-size: 12.5px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Código</td><td>${oldProp['Código']}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Tipo</td><td>${oldProp['Tipo de inmueble']}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Barrio</td><td>${oldProp['Barrio']}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Precio</td><td>$${formatP(oldProp['Precio'])}</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Área</td><td>${oldProp['Área'] || oldProp['Área Construida'] || '—'} m²</td></tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);"><td style="padding: 6px 0; font-weight: bold; color: var(--muted);">Habs / Baños</td><td>${oldProp['Habitaciones']} / ${oldProp['Baños']}</td></tr>
          </table>
        </div>
      </div>
      
      <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="document.getElementById('duplicateWarningModal').classList.remove('active')">Cancelar Guardado</button>
        <button class="btn btn-gold" id="btn_gp_dup_confirm">Guardar de todos modos (Es diferente)</button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.getElementById('btn_gp_dup_confirm').onclick = () => {
    modal.classList.remove('active');
    onConfirm();
  };
}

/* SAVE ACTION CORE */
function resetNuevaPropForm() {
  const ids = [
    'gp_codigo', 'gp_nombre', 'gp_precio', 'gp_barrio', 'gp_conjunto', 'gp_zona', 'gp_ubicacion', 'gp_area', 'gp_administracion', 'gp_rentabilidad', 'gp_descripcion', 'gp_puntos_clave', 'gp_lat', 'gp_lng', 'gp_gfotos', 'gp_inmobiliaria',
    'gp_area_lote', 'gp_celulares', 'gp_celular_2', 'gp_propietario', 'gp_renta', 'gp_antiguedad', 'gp_dimensiones'
  ];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  
  const selectIds = [
    'gp_tipo', 'gp_contrato', 'gp_estrato', 'gp_habitaciones', 'gp_banos', 'gp_garaje', 'gp_piscina', 'gp_cocina', 'gp_pisos',
    'gp_comuna', 'gp_closets', 'gp_ascensor', 'gp_reja_antejardin', 'gp_patio', 'gp_cortinas', 'gp_aire_acondicionado'
  ];
  selectIds.forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });

  const invEl = document.getElementById('gp_inventario');
  if (invEl) invEl.value = 'NO';
  
  const checkIds = ['gp_destacada', 'gp_publicar'];
  checkIds.forEach(id => { const el = document.getElementById(id); if (el) el.checked = (id==='gp_publicar'); });
  
  const preview = document.getElementById('gp_gfotos_preview');
  if (preview) preview.innerHTML = '';
}

async function guardarPropiedad(scraperAllyName = '') {
  const year = new Date().getFullYear();
  const prefix = String(year);
  let highestSeq = 0;
  allProps.forEach(p => {
    const cod = String(p['Código'] || '').trim();
    if (cod.startsWith(prefix)) {
      const seq = parseInt(cod.substring(prefix.length)) || 0;
      if (seq > highestSeq) highestSeq = seq;
    }
  });
  const newSeq = String(highestSeq + 1).padStart(2, '0');
  const generatedCode = prefix + newSeq;
  
  const codigo = document.getElementById('gp_codigo').value.trim() || generatedCode;
  const tipo = document.getElementById('gp_tipo').value;
  const contrato = document.getElementById('gp_contrato').value;
  const precioRaw = document.getElementById('gp_precio').value.replace(/[^\d]/g, "");
  const precio = parseFloat(precioRaw) || 0;
  const barrio = document.getElementById('gp_barrio').value.trim();
  
  if (!tipo || precio <= 0 || !barrio || !contrato) {
    toast('Completa Tipo, Precio (>0), Barrio y Contrato', 'error');
    return;
  }
  
  const gpData = getNuevaPropData();
  const finalProp = {
    'Código': codigo,
    'Nombre': gpData.nombre || `${tipo} en barrio ${barrio}`,
    'Tipo de inmueble': tipo,
    'Contrato': contrato,
    'Precio': precioRaw,
    'Barrio': barrio,
    'Conjunto': gpData.conjunto,
    'Zona': gpData.zona,
    'Ciudad': gpData.ciudad || 'Cali',
    'Estrato': gpData.estrato,
    'Ubicación': gpData.ubicacion_posicion || 'Medianera',
    'DIRECCIÓN': gpData.ubicacion,
    'Habitaciones': gpData.habitaciones,
    'Baños': gpData.banos,
    'Garaje': gpData.garaje,
    'Pisos': gpData.pisos || '1',
    'Área': gpData.area,
    'Área Construida': gpData.area,
    'Piscina': gpData.piscina,
    'Cocina': gpData.cocina,
    'Administración': gpData.administracion.replace(/[^\d]/g, ""),
    'Retorno de la inversión': gpData.rentabilidad,
    'Descripción': gpData.descripcion,
    'Puntos Clave': gpData.puntos_clave,
    'Latitud': gpData.lat,
    'Longitud': gpData.lng,
    'Google Fotos': gpData.gfotos,
    'Imagenes': '',
    'Publicar': gpData.publicar ? 'SI' : 'NO',
    'Destacada': gpData.destacada ? 'SI' : 'NO',
    'Inmobiliaria': scraperAllyName || gpData.inmobiliaria || '',
    'Comuna': gpData.comuna,
    'Área lote': gpData.area_lote,
    'Closet': gpData.closets,
    'Inventario': gpData.inventario,
    'Celular 1': gpData.celulares,
    'Celular 2': gpData.celular_2,
    'Celulares': gpData.celulares,
    'Nombre del Propietario': gpData.propietario,
    'Cuánto Renta ($)': gpData.renta ? gpData.renta.replace(/[^\d]/g, "") : '',
    'Ascensor': gpData.ascensor,
    'Número de Cortinas': gpData.cortinas,
    'Aire Acondicionado': gpData.aire_acondicionado,
    'Reja Antejardín': gpData.reja_antejardin,
    'Antigüedad del Inmueble': gpData.antiguedad,
    'Patio': gpData.patio,
    'Dimensiones': gpData.dimensiones
  };
  
  const previewDiv = document.getElementById('gp_gfotos_preview');
  if (previewDiv) {
    const imgs = Array.from(previewDiv.querySelectorAll('img')).map(img => img.src.split('=')[0]);
    if (imgs.length > 0) {
      finalProp['Imagenes'] = imgs.join('|');
    }
  }
  
  const dupCheck = calcularDuplicado(finalProp);
  if (dupCheck.score >= 3) {
    showDuplicateModal(finalProp, dupCheck.prop, () => {
      ejecutarGuardadoPropiedad(finalProp);
    });
  } else {
    ejecutarGuardadoPropiedad(finalProp);
  }
}

async function ejecutarGuardadoPropiedad(prop) {
  const btn = document.getElementById('btn_gp_guardar');
  const btnText = btn.innerHTML;
  btn.innerHTML = 'Guardando...';
  btn.disabled = true;
  
  try {
    const scriptUrl = APPS_SCRIPT_URL.split('?')[0];
    
    // AGREGAR AL APPS SCRIPT:
    // case 'appendRow':
    //   const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Base de Datos');
    //   const row = buildRowFromJson(JSON.parse(e.postData.contents));
    //   sheet.appendRow(row);
    //   return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
    
    const response = await fetch(`${scriptUrl}?action=appendRow`, {
      method: 'POST',
      body: JSON.stringify(prop)
    });
    const result = await response.json();
    
    if (result && result.ok) {
      toast('Propiedad guardada y sincronizada ✓', 'success');
      
      const customProps = JSON.parse(localStorage.getItem('icde_custom_props') || '[]');
      customProps.push(prop);
      localStorage.setItem('icde_custom_props', JSON.stringify(customProps));
      
      allProps.push(prop);
      
      if (prop['Inmobiliaria']) {
        actualizarUltimoBarridoAliado(prop['Inmobiliaria']);
        logSweepRecord(prop['Inmobiliaria'], 1, 1, 0);
      }
      
      descartarBorradorPropiedad();
      resetNuevaPropForm();
      renderGestion();
    } else {
      throw new Error('Sync fail');
    }
  } catch (e) {
    console.error(e);
    toast('Error en sync. Guardando localmente...', 'warning');
    
    const customProps = JSON.parse(localStorage.getItem('icde_custom_props') || '[]');
    customProps.push(prop);
    localStorage.setItem('icde_custom_props', JSON.stringify(customProps));
    
    allProps.push(prop);
    
    if (prop['Inmobiliaria']) {
      actualizarUltimoBarridoAliado(prop['Inmobiliaria']);
      logSweepRecord(prop['Inmobiliaria'], 1, 1, 0);
    }
    
    descartarBorradorPropiedad();
    resetNuevaPropForm();
    renderGestion();
  } finally {
    btn.innerHTML = btnText;
    btn.disabled = false;
  }
}

/* SUB-TAB 2: BARRIDO DE ALIADOS */
function renderBarridoAliados() {
  const sub = document.getElementById('gestionSubContent');
  const aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  
  if (!window.currentBarridoMode) {
    window.currentBarridoMode = 'link';
  }
  
  sub.innerHTML = `
    <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 20px;">
      <div style="font-size:16px; font-weight:700; color:var(--gold); margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
        📡 Extractor de Propiedades Aliadas
      </div>
      
      <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap:15px; margin-bottom: 20px;">
        <div class="form-group">
          <label class="form-label">Seleccionar Aliado</label>
          <select class="form-input" id="sw_aliado">
            <option value="">Selecciona...</option>
            ${aliados.map(a => `<option value="${a.nombre}" ${window.preselectedAllyId===a.id?'selected':''}>${a.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Método de Extracción</label>
          <div style="display:flex; gap:8px;">
            <button class="btn ${window.currentBarridoMode==='link'?'btn-primary':'btn-secondary'}" onclick="setBarridoMode('link')" style="flex:1; padding:6px 0;">🔗 Link</button>
            <button class="btn ${window.currentBarridoMode==='screenshot'?'btn-primary':'btn-secondary'}" onclick="setBarridoMode('screenshot')" style="flex:1; padding:6px 0;">📸 Captura</button>
            <button class="btn ${window.currentBarridoMode==='text'?'btn-primary':'btn-secondary'}" onclick="setBarridoMode('text')" style="flex:1; padding:6px 0;">✍️ Texto</button>
          </div>
        </div>
      </div>
      
      <div id="sw_mode_content"></div>
    </div>
    
    <div id="sw_review_container" style="display:none; background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 24px;"></div>
  `;
  
  // Clear preselected
  window.preselectedAllyId = null;
  
  renderBarridoModeContent();
}

function setBarridoMode(mode) {
  window.currentBarridoMode = mode;
  renderBarridoModeContent();
  const container = document.getElementById('sw_review_container');
  if (container) container.style.display = 'none';
}

function renderBarridoModeContent() {
  const c = document.getElementById('sw_mode_content');
  if (!c) return;
  
  const selectAlly = document.getElementById('sw_aliado');
  
  if (window.currentBarridoMode === 'link') {
    c.innerHTML = `
      <div class="form-group full">
        <label class="form-label">Pegar URL del Inmueble</label>
        <div style="display:flex; gap:10px;">
          <input class="form-input" id="sw_url" type="text" placeholder="https://ejemplo.com/propiedad/apartamento-arriendo-..." style="flex:1;"/>
          <button class="btn btn-gold" id="btn_sw_link_ia" onclick="swExtraerLinkIA()">✨ Extraer con IA</button>
        </div>
      </div>
    `;
  } else if (window.currentBarridoMode === 'screenshot') {
    c.innerHTML = `
      <div class="form-group full">
        <label class="form-label">Cargar o Pegar Captura de Pantalla</label>
        <div class="sw-dropzone" id="sw_dropzone" onclick="document.getElementById('sw_file_input').click()">
          <span style="font-size:24px; display:block; margin-bottom:8px;">📸</span>
          Haz clic para cargar imagen o presiona <strong>Ctrl+V</strong> en cualquier parte para pegar una captura del clipboard
        </div>
        <input type="file" id="sw_file_input" style="display:none;" accept="image/*" onchange="onScreenshotUploaded(this)"/>
        <div id="sw_screenshot_preview" style="margin-top:15px; text-align:center;"></div>
        <button class="btn btn-gold" id="btn_sw_screenshot_ia" onclick="swExtraerScreenshotIA()" style="width:100%; margin-top:15px;">✨ Extraer de Imagen con Vision</button>
      </div>
    `;
    setupDropzonePaste();
  } else if (window.currentBarridoMode === 'text') {
    c.innerHTML = `
      <div class="form-group full">
        <label class="form-label">Pegar Texto Libre o Ficha Técnica</label>
        <textarea class="form-input" id="sw_text" style="min-height: 150px;" placeholder="Pega aquí la descripción o ficha técnica completa del inmueble..."></textarea>
        <button class="btn btn-gold" id="btn_sw_text_ia" onclick="swExtraerTextoIA()" style="width:100%; margin-top:15px;">✨ Extraer de Texto con IA</button>
      </div>
    `;
  }
}

async function swExtraerLinkIA() {
  const url = document.getElementById('sw_url').value.trim();
  const aliado = document.getElementById('sw_aliado').value;
  if (!url || !aliado) {
    toast('Por favor selecciona un aliado y pega una URL', 'error');
    return;
  }
  
  if (!settings.geminiKey) {
    toast('Configura tu API Key de IA en Configuración ⚙️', 'error');
    return;
  }
  
  const btn = document.getElementById('btn_sw_link_ia');
  btn.innerHTML = 'Extrayendo...';
  btn.disabled = true;
  
  try {
    const proxiedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxiedUrl);
    const data = await res.json();
    let html = data.contents || "";
    
    // Clean raw html tags and script tags
    const cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                          .replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ')
                          .substring(0, 16000);
                          
    const prompt = `Eres un extractor de datos de propiedades inmobiliarias colombianas. Del siguiente texto de una página web inmobiliaria, extrae toda la información en JSON puro, sin bloques de código ni markdown (objeto JSON directo):
    {
      "codigo": "Código",
      "nombre": "Nombre del inmueble",
      "tipo": "Casa, Apartamento, Local, Lote, Bodega, Finca, Oficina",
      "contrato": "Venta, Arriendo, Venta/Arriendo",
      "precio": 350000000,
      "barrio": "Barrio",
      "zona": "Zona",
      "ciudad": "Ciudad",
      "estrato": "1 a 6",
      "ubicacion": "Dirección",
      "habitaciones": "1 a 6+",
      "banos": "1 a 5+",
      "garaje": "No, 1, 2, 3+",
      "area": 120,
      "descripcion": "Descripción larga comercial",
      "puntosClave": ["Punto 1", "Punto 2"],
      "latitud": 3.3986,
      "longitud": -76.5321,
      "googleFotos": "",
      "comuna": "Comuna si se menciona",
      "areaLote": 200,
      "closets": "0, 1, 2, 3, 4, o 5+",
      "inventario": "SI o NO",
      "celulares": "Celulares del propietario si se mencionan",
      "propietario": "Nombre del propietario si se menciona",
      "renta": 1200000,
      "ascensor": "SI o NO",
      "cortinas": 0,
      "aireAcondicionado": "SI o NO o cantidad o texto libre",
      "rejaAntejardin": "SI o NO",
      "antiguedad": "Antigüedad del inmueble, ej: 5 años, Nuevo, Remodelado",
      "patio": "SI o NO",
      "dimensiones": "dimensiones del lote/inmueble, ej: 7x12"
    }
    Si no encuentras un campo usa null o el valor por defecto si corresponde.
    
    Texto web:
    "${cleanText}"`;
    
    let resultText = await callAIEngine(prompt);
    resultText = resultText.replace(/```json|```/g, '').trim();
    
    const result = JSON.parse(resultText);
    swShowReviewForm(result);
    toast('¡Datos extraídos con éxito! ✓', 'success');
  } catch (e) {
    console.error(e);
    toast('Error al extraer datos de la URL', 'error');
  } finally {
    btn.innerHTML = '✨ Extraer con IA';
    btn.disabled = false;
  }
}

function setupDropzonePaste() {
  setTimeout(() => {
    const dz = document.getElementById('sw_dropzone');
    if (!dz) return;
    
    // Paste handler
    window.onPasteScreenshot = function(e) {
      if (window.currentGestionSubTab !== 'barrido' || window.currentBarridoMode !== 'screenshot') return;
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          readScreenshotFile(file);
        }
      }
    };
    document.addEventListener('paste', window.onPasteScreenshot);
  }, 100);
}

function onScreenshotUploaded(input) {
  if (input.files && input.files[0]) {
    readScreenshotFile(input.files[0]);
  }
}

function readScreenshotFile(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const base64 = event.target.result;
    const preview = document.getElementById('sw_screenshot_preview');
    if (preview) {
      preview.innerHTML = `<img src="${base64}" style="max-width:100%; max-height:220px; border-radius:12px; border:2px solid var(--gold); box-shadow:var(--shadow);"/>`;
    }
    window.pastedScreenshotBase64 = base64.split(',')[1];
    toast('Imagen cargada ✓. Presiona Extraer.', 'success');
  };
  reader.readAsDataURL(file);
}

async function swExtraerScreenshotIA() {
  if (!settings.geminiKey) {
    toast('Configura tu API Key de IA en Configuración ⚙️', 'error');
    return;
  }
  
  if (!window.pastedScreenshotBase64) {
    toast('Carga o pega una imagen primero', 'error');
    return;
  }
  
  const btn = document.getElementById('btn_sw_screenshot_ia');
  btn.innerHTML = 'Extrayendo con Vision...';
  btn.disabled = true;
  
  const prompt = `Eres un extractor de datos de propiedades inmobiliarias colombianas. Analiza el screenshot del inmueble adjunto y extrae todos los detalles posibles en JSON puro, sin bloques de código ni markdown (objeto JSON directo):
  {
    "codigo": "Código si existe en la imagen",
    "nombre": "Título del inmueble",
    "tipo": "Casa, Apartamento, Local, Lote, Bodega, Finca, Oficina",
    "contrato": "Venta, Arriendo, Venta/Arriendo",
    "precio": 350000000,
    "barrio": "Barrio",
    "zona": "Zona si se menciona",
    "ciudad": "Cali u otra",
    "estrato": "1 a 6",
    "ubicacion": "Dirección si se menciona",
    "habitaciones": "1 a 6+",
    "banos": "1 a 5+",
    "garaje": "No, 1, 2, 3+",
    "area": 120,
    "descripcion": "Descripción detallada comercial",
    "puntosClave": ["Punto 1", "Punto 2"],
    "latitud": 3.3986,
    "longitud": -76.5321,
    "googleFotos": "",
    "comuna": "Comuna si se menciona",
    "areaLote": 200,
    "closets": "0, 1, 2, 3, 4, o 5+",
    "inventario": "SI o NO",
    "celulares": "Celulares del propietario si se mencionan",
    "propietario": "Nombre del propietario si se menciona",
    "renta": 1200000,
    "ascensor": "SI o NO",
    "cortinas": 0,
    "aireAcondicionado": "SI o NO o cantidad o texto libre",
    "rejaAntejardin": "SI o NO",
    "antiguedad": "Antigüedad del inmueble, ej: 5 años, Nuevo, Remodelado",
    "patio": "SI o NO",
    "dimensiones": "dimensiones del lote/inmueble, ej: 7x12"
  }
  Si no encuentras un campo usa null o el valor por defecto si corresponde.`;
  
  try {
    let text = await callAIEngine(prompt, '', window.pastedScreenshotBase64);
    text = text.replace(/```json|```/g, '').trim();
    
    const result = JSON.parse(text);
    swShowReviewForm(result);
    toast('¡Datos extraídos con éxito! ✓', 'success');
  } catch (e) {
    console.error(e);
    toast('Error al extraer datos de Vision', 'error');
  } finally {
    btn.innerHTML = '✨ Extraer de Imagen con Vision';
    btn.disabled = false;
  }
}

async function swExtraerTextoIA() {
  const val = document.getElementById('sw_text').value.trim();
  const aliado = document.getElementById('sw_aliado').value;
  if (!val || !aliado) {
    toast('Por favor selecciona un aliado y pega la ficha técnica', 'error');
    return;
  }
  
  if (!settings.geminiKey) {
    toast('Configura tu API Key de IA en Configuración ⚙️', 'error');
    return;
  }
  
  const btn = document.getElementById('btn_sw_text_ia');
  btn.innerHTML = 'Procesando...';
  btn.disabled = true;
  
  const prompt = `Eres un extractor de datos de propiedades inmobiliarias colombianas. Del siguiente texto o ficha técnica, extrae toda la información en JSON puro, sin bloques de código ni markdown (objeto JSON directo):
  {
    "codigo": "Código",
    "nombre": "Nombre del inmueble",
    "tipo": "Casa, Apartamento, Local, Lote, Bodega, Finca, Oficina",
    "contrato": "Venta, Arriendo, Venta/Arriendo",
    "precio": 350000000,
    "barrio": "Barrio",
    "zona": "Zona",
    "ciudad": "Ciudad",
    "estrato": "1 a 6",
    "ubicacion": "Dirección",
    "habitaciones": "1 a 6+",
    "banos": "1 a 5+",
    "garaje": "No, 1, 2, 3+",
    "area": 120,
    "descripcion": "Descripción larga comercial",
    "puntosClave": ["Punto 1", "Punto 2"],
    "latitud": 3.3986,
    "longitud": -76.5321,
    "googleFotos": "",
    "comuna": "Comuna si se menciona",
    "areaLote": 200,
    "closets": "0, 1, 2, 3, 4, o 5+",
    "inventario": "SI o NO",
    "celulares": "Celulares del propietario si se mencionan",
    "propietario": "Nombre del propietario si se menciona",
    "renta": 1200000,
    "ascensor": "SI o NO",
    "cortinas": 0,
    "aireAcondicionado": "SI o NO o cantidad o texto libre",
    "rejaAntejardin": "SI o NO",
    "antiguedad": "Antigüedad del inmueble, ej: 5 años, Nuevo, Remodelado",
    "patio": "SI o NO",
    "dimensiones": "dimensiones del lote/inmueble, ej: 7x12"
  }
  Si no encuentras un campo usa null o el valor por defecto si corresponde.
  
  Texto:
  "${val}"`;
  
  try {
    let text = await callAIEngine(prompt);
    text = text.replace(/```json|```/g, '').trim();
    
    const result = JSON.parse(text);
    swShowReviewForm(result);
    toast('¡Datos extraídos con éxito! ✓', 'success');
  } catch (e) {
    console.error(e);
    toast('Error al extraer datos del texto', 'error');
  } finally {
    btn.innerHTML = '✨ Extraer de Texto con IA';
    btn.disabled = false;
  }
}

function swShowReviewForm(data) {
  const container = document.getElementById('sw_review_container');
  container.style.display = 'block';
  
  const emptyClass = val => (!val || val === 'null' || val === 'undefined') ? 'empty-orange' : 'extracted-gold';
  const emptyCheck = val => (!val || val === 'null' || val === 'undefined') ? '' : val;
  
  let priceStr = "";
  if (data.precio) {
    priceStr = Number(data.precio).toLocaleString('es-CO');
  }
  
  const normSiNo = val => {
    if (!val) return 'NO';
    const clean = String(val).toUpperCase().trim();
    return (clean === 'SI' || clean === 'SÍ' || clean === 'YES' || clean === 'TRUE' || clean === '1') ? 'SI' : 'NO';
  };
  const closetsVal = data.closets !== undefined && data.closets !== null ? String(data.closets).trim() : '0';
  let rentaStr = "";
  if (data.renta) {
    const rawRenta = String(data.renta).replace(/[^\d]/g, "");
    if (rawRenta) {
      rentaStr = Number(rawRenta).toLocaleString('es-CO');
    }
  }
  
  const uniqueBarrios = Array.from(new Set(allProps.map(p => p['Barrio']).filter(Boolean)));
  const datalistHTML = `<datalist id="datalist_barrios">${uniqueBarrios.map(b => `<option value="${b}"></option>`).join('')}</datalist>`;
  
  container.innerHTML = `
    ${datalistHTML}
    <div style="font-size:16px; font-weight:700; color:var(--gold); margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
      🔍 Verificar Inmueble Extraído
    </div>
    <p style="font-size:12px; color:var(--muted); margin-bottom:20px;">
      Bordes <span style="color:var(--gold); font-weight:bold;">dorados</span>: Datos exitosos. Bordes <span style="color:#f97316; font-weight:bold;">naranjas</span>: Vacíos o aproximados.
    </p>
    
    <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-bottom: 24px;">
      <div class="form-group"><label class="form-label">Código</label><input class="form-input ${emptyClass(data.codigo)}" id="gp_codigo" type="text" value="${emptyCheck(data.codigo)}" placeholder="Generación automática"/></div>
      <div class="form-group"><label class="form-label">Nombre *</label>
        <div style="display:flex; gap:6px;">
          <input class="form-input ${emptyClass(data.nombre)}" id="gp_nombre" type="text" value="${emptyCheck(data.nombre)}" style="flex:1;"/>
          <button class="btn btn-secondary btn-sm" onclick="gpAutoGenerarNombre()" style="padding:0 8px;">Auto</button>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Tipo de inmueble</label>
        <select class="form-input ${emptyClass(data.tipo)}" id="gp_tipo">
          <option value="Apartamento" ${data.tipo==='Apartamento'?'selected':''}>Apartamento</option>
          <option value="Casa" ${data.tipo==='Casa'?'selected':''}>Casa</option>
          <option value="Local" ${data.tipo==='Local'?'selected':''}>Local</option>
          <option value="Lote" ${data.tipo==='Lote'?'selected':''}>Lote</option>
          <option value="Bodega" ${data.tipo==='Bodega'?'selected':''}>Bodega</option>
          <option value="Finca" ${data.tipo==='Finca'?'selected':''}>Finca</option>
          <option value="Oficina" ${data.tipo==='Oficina'?'selected':''}>Oficina</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Contrato</label>
        <select class="form-input ${emptyClass(data.contrato)}" id="gp_contrato">
          <option value="Directo" ${data.contrato==='Directo'?'selected':''}>Directo</option>
          <option value="Aliado" ${data.contrato==='Aliado'?'selected':''}>Aliado</option>
          <option value="Verbal" ${data.contrato==='Verbal'?'selected':''}>Verbal</option>
          <option value="No Servicio" ${data.contrato==='No Servicio'?'selected':''}>No Servicio</option>
          ${data.contrato && !['Directo','Aliado','Verbal','No Servicio'].includes(data.contrato) ? `<option value="${data.contrato}" selected>${data.contrato}</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Precio *</label><input class="form-input ${emptyClass(data.precio)}" id="gp_precio" type="text" value="${priceStr}" oninput="formatPrecioOnInput(this)"/></div>
      <div class="form-group" style="position:relative;"><label class="form-label">Barrio *</label>
        <input class="form-input ${emptyClass(data.barrio)}" id="gp_barrio" type="text" value="${emptyCheck(data.barrio)}" onblur="autocompletarBarrio(this.value)" list="datalist_barrios"/>
        <span class="autofilled-msg" id="gp_barrio_msg" style="display:none; position:absolute; right:10px; bottom:-16px;"></span>
      </div>
      <div class="form-group"><label class="form-label">Conjunto / Edificio</label><input class="form-input ${emptyClass(data.conjunto)}" id="gp_conjunto" type="text" value="${emptyCheck(data.conjunto)}"/></div>
      <div class="form-group"><label class="form-label">Zona</label>
        <select class="form-input ${emptyClass(data.zona)}" id="gp_zona">
          <option value="">Selecciona...</option>
          ${['Centro', 'Norte', 'Occidente', 'Oriente', 'Rural', 'Sur'].map(z => `<option value="${z}" ${data.zona === z ? 'selected' : ''}>${z}</option>`).join('')}
          ${data.zona && !['Centro', 'Norte', 'Occidente', 'Oriente', 'Rural', 'Sur'].includes(data.zona) ? `<option value="${data.zona}" selected>${data.zona}</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Ciudad</label><input class="form-input ${emptyClass(data.ciudad)}" id="gp_ciudad" type="text" value="${data.ciudad || 'Cali'}"/></div>
      <div class="form-group"><label class="form-label">Estrato</label>
        <select class="form-input ${emptyClass(data.estrato)}" id="gp_estrato">
          <option value="">Selecciona...</option>
          ${[1,2,3,4,5,6].map(e => `<option value="${e}" ${data.estrato==e?'selected':''}>${e}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Dirección</label><input class="form-input ${emptyClass(data.ubicacion)}" id="gp_ubicacion" type="text" value="${emptyCheck(data.ubicacion)}"/></div>
      <div class="form-group"><label class="form-label">Habitaciones</label>
        <select class="form-input ${emptyClass(data.habitaciones)}" id="gp_habitaciones">
          ${[1,2,3,4,5,'6+'].map(h => `<option value="${h}" ${data.habitaciones==h?'selected':''}>${h}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Baños</label>
        <select class="form-input ${emptyClass(data.banos)}" id="gp_banos">
          ${[1,2,3,4,'5+'].map(b => `<option value="${b}" ${data.banos==b?'selected':''}>${b}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Garaje</label>
        <select class="form-input ${emptyClass(data.garaje)}" id="gp_garaje">
          <option value="No" ${data.garaje==='No'?'selected':''}>No</option>
          <option value="1" ${data.garaje==='1'?'selected':''}>1</option>
          <option value="2" ${data.garaje==='2'?'selected':''}>2</option>
          <option value="3+" ${data.garaje==='3+'?'selected':''}>3+</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Google Fotos (Álbum)</label>
        <input class="form-input ${emptyClass(data.googleFotos)}" id="gp_gfotos" type="text" value="${emptyCheck(data.googleFotos)}" oninput="debounceGFotosPreview(this.value)"/>
        <div id="gp_gfotos_preview" style="margin-top:10px;"></div>
      </div>
      <div class="form-group"><label class="form-label">Inmobiliaria / Aliado</label><input class="form-input" id="gp_inmobiliaria" type="text" value="${document.getElementById('sw_aliado')?.value || ''}" readonly/></div>
      <div class="form-group"><label class="form-label">Administración ($)</label><input class="form-input" id="gp_administracion" type="text" value="" oninput="formatPrecioOnInput(this)"/></div>
      <div class="form-group"><label class="form-label">Retorno inversión</label><input class="form-input" id="gp_rentabilidad" type="text" placeholder="Ej: 8% anual"/></div>
      
      <div class="form-group"><label class="form-label">Comuna</label>
        <select class="form-input ${emptyClass(data.comuna)}" id="gp_comuna">
          ${Array.from({length: 11}, (_, i) => {
            const isSelected = String(data.comuna).trim() === String(i) ? 'selected' : '';
            return `<option value="${i}" ${isSelected}>${i}</option>`;
          }).join('')}
          ${data.comuna && !Array.from({length: 11}, (_, i) => String(i)).includes(String(data.comuna).trim()) ? `<option value="${data.comuna}" selected>${data.comuna}</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Área de Lote (m²)</label><input class="form-input ${emptyClass(data.areaLote)}" id="gp_area_lote" type="number" value="${emptyCheck(data.areaLote)}" placeholder="m²"/></div>
      <div class="form-group"><label class="form-label">Área Construida (m²)</label><input class="form-input ${emptyClass(data.area)}" id="gp_area" type="number" value="${emptyCheck(data.area)}"/></div>
      <div class="form-group"><label class="form-label">Clósets</label>
        <select class="form-input ${emptyClass(data.closets)}" id="gp_closets">
          ${['0','1','2','3','4','5+'].map(val => `<option value="${val}" ${closetsVal === val ? 'selected' : ''}>${val}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Inventario</label>
        <select class="form-input ${emptyClass(data.inventario)}" id="gp_inventario">
          <option value="NO" ${normSiNo(data.inventario) === 'NO' ? 'selected' : ''}>NO</option>
          <option value="Inventario" ${normSiNo(data.inventario) === 'SI' || String(data.inventario).toUpperCase().trim() === 'INVENTARIO' ? 'selected' : ''}>Inventario</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Celular 1</label><input class="form-input ${emptyClass(data.celulares)}" id="gp_celulares" type="text" value="${emptyCheck(data.celulares)}" placeholder="Celular 1"/></div>
      <div class="form-group"><label class="form-label">Celular 2</label><input class="form-input ${emptyClass(data.celular_2 || data.celular2)}" id="gp_celular_2" type="text" value="${emptyCheck(data.celular_2 || data.celular2)}" placeholder="Celular 2"/></div>
      <div class="form-group"><label class="form-label">Nombre del Propietario</label><input class="form-input ${emptyClass(data.propietario)}" id="gp_propietario" type="text" value="${emptyCheck(data.propietario)}" placeholder="Propietario"/></div>
      <div class="form-group"><label class="form-label">Cuánto Renta ($)</label><input class="form-input ${emptyClass(data.renta)}" id="gp_renta" type="text" value="${rentaStr}" oninput="formatPrecioOnInput(this)" placeholder="Cuánto renta"/></div>
      <div class="form-group"><label class="form-label">Ascensor</label>
        <select class="form-input ${emptyClass(data.ascensor)}" id="gp_ascensor">
          <option value="NO" ${normSiNo(data.ascensor) === 'NO' ? 'selected' : ''}>NO</option>
          <option value="SI" ${normSiNo(data.ascensor) === 'SI' ? 'selected' : ''}>SI</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Número de Cortinas</label>
        <select class="form-input ${emptyClass(data.cortinas)}" id="gp_cortinas">
          ${['0', 'NO', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'SI'].map(val => {
            const isSelected = String(data.cortinas).trim().toUpperCase() === String(val).toUpperCase() ? 'selected' : '';
            return `<option value="${val}" ${isSelected}>${val}</option>`;
          }).join('')}
          ${data.cortinas && !['0', 'NO', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'SI'].map(x => x.toUpperCase()).includes(String(data.cortinas).trim().toUpperCase()) ? `<option value="${data.cortinas}" selected>${data.cortinas}</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Aire Acondicionado</label>
        <select class="form-input ${emptyClass(data.aireAcondicionado)}" id="gp_aire_acondicionado">
          ${['0', 'NO', '1', '2', '3', '4', '5', 'SI'].map(val => {
            const isSelected = String(data.aireAcondicionado).trim().toUpperCase() === String(val).toUpperCase() ? 'selected' : '';
            return `<option value="${val}" ${isSelected}>${val}</option>`;
          }).join('')}
          ${data.aireAcondicionado && !['0', 'NO', '1', '2', '3', '4', '5', 'SI'].map(x => x.toUpperCase()).includes(String(data.aireAcondicionado).trim().toUpperCase()) ? `<option value="${data.aireAcondicionado}" selected>${data.aireAcondicionado}</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Reja Antejardín</label>
        <select class="form-input ${emptyClass(data.rejaAntejardin)}" id="gp_reja_antejardin">
          <option value="NO" ${normSiNo(data.rejaAntejardin) === 'NO' ? 'selected' : ''}>NO</option>
          <option value="SI" ${normSiNo(data.rejaAntejardin) === 'SI' ? 'selected' : ''}>SI</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Antigüedad del Inmueble</label><input class="form-input ${emptyClass(data.antiguedad)}" id="gp_antiguedad" type="text" value="${emptyCheck(data.antiguedad)}" placeholder="Ej: 5 años, Nuevo, Remodelado"/></div>
      <div class="form-group"><label class="form-label">Patio</label>
        <select class="form-input ${emptyClass(data.patio)}" id="gp_patio">
          ${['0', 'SI', 'NO', 'G', 'M', 'P', 'A', '1', '2'].map(val => {
            const isSelected = String(data.patio).trim().toUpperCase() === String(val).toUpperCase() ? 'selected' : '';
            return `<option value="${val}" ${isSelected}>${val}</option>`;
          }).join('')}
          ${data.patio && !['0', 'SI', 'NO', 'G', 'M', 'P', 'A', '1', '2'].map(x => x.toUpperCase()).includes(String(data.patio).trim().toUpperCase()) ? `<option value="${data.patio}" selected>${data.patio}</option>` : ''}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Dimensiones</label><input class="form-input ${emptyClass(data.dimensiones)}" id="gp_dimensiones" type="text" value="${emptyCheck(data.dimensiones)}" placeholder="Ej: 7x12m"/></div>
      
      <div class="form-group"><label class="form-label">Latitud</label><input class="form-input" id="gp_lat" type="number" step="any" value="${emptyCheck(data.latitud)}"/></div>
      <div class="form-group"><label class="form-label">Longitud</label><input class="form-input" id="gp_lng" type="number" step="any" value="${emptyCheck(data.longitud)}"/></div>
      
      <div class="form-group" style="display:flex; flex-direction:column; gap:8px; justify-content:center; background:rgba(255,255,255,0.02); padding:12px; border-radius:8px; border:1px solid var(--border);">
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px;"><input type="checkbox" id="gp_destacada"/> Destacada ⭐</label>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px;"><input type="checkbox" id="gp_publicar" checked/> Publicar en Web 👁️</label>
      </div>
      
      <div class="form-group full"><label class="form-label">Descripción</label><textarea class="form-input ${emptyClass(data.descripcion)}" id="gp_descripcion" style="min-height:100px;">${emptyCheck(data.descripcion)}</textarea></div>
      <div class="form-group full">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label class="form-label">Puntos Clave</label>
          <button class="btn btn-secondary btn-sm" id="btn_gp_pc_ia" onclick="gpGenerarPuntosClaveIA()" style="font-size:10px; padding:2px 6px;">✨ Extraer de Desc.</button>
        </div>
        <textarea class="form-input ${emptyClass(data.puntosClave)}" id="gp_puntos_clave" style="min-height:80px;">${(data.puntosClave || []).join('\n')}</textarea>
      </div>
    </div>
    
    <div style="display:flex; gap:12px; justify-content:flex-end;">
      <button class="btn btn-secondary" onclick="gpVistaPrevia()">👁️ Vista Previa</button>
      <button class="btn btn-primary" id="btn_gp_guardar" onclick="guardarBarridoPropiedad()">💾 Guardar Propiedad</button>
    </div>
  `;
  
  if (data.googleFotos) {
    debounceGFotosPreview(data.googleFotos);
  }
}

function guardarBarridoPropiedad() {
  const aliadoName = document.getElementById('gp_inmobiliaria').value;
  guardarPropiedad(aliadoName);
}

/* HISTORIAL DE BARRIDOS & DIFF (FASE 8) */
function logSweepRecord(aliado, total, nuevos, actualizados) {
  const history = JSON.parse(localStorage.getItem('icde_historial_barridos') || '[]');
  const record = {
    id: Date.now() + Math.floor(Math.random()*1000),
    aliado: aliado,
    fecha: new Date().toISOString().split('T')[0],
    propiedadesTotal: total,
    propiedadesNuevas: nuevos,
    propiedadesActualizadas: actualizados
  };
  history.unshift(record);
  localStorage.setItem('icde_historial_barridos', JSON.stringify(history));
}

/* SUB-TAB 3: GESTION DE ALIADOS & CRUD */
function renderGestionAliados() {
  const sub = document.getElementById('gestionSubContent');
  const aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  const history = JSON.parse(localStorage.getItem('icde_historial_barridos') || '[]');
  
  const getStatusBadge = (aliado) => {
    if (!aliado.ultimoBarrido) return `<span class="ally-badge badge-warning">Nunca</span>`;
    
    const lastDate = new Date(aliado.ultimoBarrido);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + (parseInt(aliado.frecuenciaDias) || 15));
    
    const today = new Date();
    const diff = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return `<span class="ally-badge badge-overdue">Vencido (${Math.abs(diff)}d)</span>`;
    if (diff <= 2) return `<span class="ally-badge badge-warning">Próximo (${diff}d)</span>`;
    return `<span class="ally-badge badge-ontime">Al día</span>`;
  };
  
  sub.innerHTML = `
    <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px;">
        <div style="font-size:16px; font-weight:700; color:var(--gold);">📋 Directorio de Aliados</div>
        <button class="btn btn-primary btn-sm" onclick="showAddAllyModal()">➕ Agregar Aliado</button>
      </div>
      
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>URL Base</th>
              <th>Frecuencia</th>
              <th>Último Barrido</th>
              <th>Próximo Barrido</th>
              <th>Estado</th>
              <th style="text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${aliados.map(a => {
              const last = a.ultimoBarrido || 'Nunca';
              let next = '—';
              if (a.ultimoBarrido) {
                const nextDate = new Date(a.ultimoBarrido);
                nextDate.setDate(nextDate.getDate() + (parseInt(a.frecuenciaDias) || 15));
                next = nextDate.toISOString().split('T')[0];
              }
              
              const allyHist = history.filter(h => norm(h.aliado) === norm(a.nombre)).slice(0, 5);
              
              return `
                <tr>
                  <td>
                    <div style="font-weight:700; color:#fff;">${a.nombre}</div>
                    <div style="font-size:11px; color:var(--muted);">${a.notas || 'Sin notas'}</div>
                    ${allyHist.length > 0 ? `
                      <div style="margin-top:6px;">
                        <a href="javascript:void(0)" onclick="toggleAllyHistory('${a.id}')" style="font-size:11px; color:var(--gold); text-decoration:none;">📜 Historial (${allyHist.length} barridos)</a>
                        <div id="hist_${a.id}" style="display:none; margin-top:6px; background:rgba(255,255,255,0.02); padding:8px; border-radius:8px; border:1px solid var(--border); font-size:10.5px; color:var(--muted);">
                          ${allyHist.map(h => `<div>· <strong>${h.fecha}</strong>: Extraído <strong>${h.propiedadesTotal}</strong> prop.</div>`).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </td>
                  <td><a href="${a.urlBase}" target="_blank" style="color:var(--gold); text-decoration:none; font-size:12px;">${a.urlBase}</a></td>
                  <td>Cada ${a.frecuenciaDias} días</td>
                  <td>${last}</td>
                  <td>${next}</td>
                  <td>${getStatusBadge(a)}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm" onclick="iniciarBarridoAliado('${a.id}')" style="padding:4px 8px; font-size:11px; margin-right:4px;">📡 Barrer</button>
                    <button class="btn btn-secondary btn-sm" onclick="showEditAllyModal('${a.id}')" style="padding:4px 8px; font-size:11px; margin-right:4px;">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAlly('${a.id}')" style="padding:4px 8px; font-size:11px;">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function toggleAllyHistory(allyId) {
  const el = document.getElementById(`hist_${allyId}`);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

function checkOverdueSweepAlert() {
  const aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  const alertContainer = document.getElementById('gestionAlerts');
  if (!alertContainer) return;
  
  const today = new Date();
  let overdueAlly = null;
  let overdueDaysStr = "";
  
  for (let a of aliados) {
    if (!a.ultimoBarrido) {
      overdueAlly = a;
      overdueDaysStr = "primera vez";
      break;
    }
    
    const lastDate = new Date(a.ultimoBarrido);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + (parseInt(a.frecuenciaDias) || 15));
    
    const timeDiff = nextDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 2) {
      overdueAlly = a;
      const formattedNextDate = nextDate.toLocaleDateString();
      overdueDaysStr = daysDiff < 0 ? `vencido hace ${Math.abs(daysDiff)} días` : `programado para el ${formattedNextDate}`;
      break;
    }
  }
  
  if (overdueAlly) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = 'background:rgba(212,168,75,0.12); border:1px solid var(--gold); border-radius:12px; padding:15px; display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; animation:slideIn 0.3s ease;';
    alertDiv.innerHTML = `
      <div style="font-size:13px; display:flex; align-items:center; gap:8px;">
        <span>⚠️</span> 
        <span>El barrido para <strong>${overdueAlly.nombre}</strong> está <strong>${overdueDaysStr}</strong>.</span>
      </div>
      <button class="btn btn-gold btn-sm" onclick="iniciarBarridoAliado('${overdueAlly.id}')">📡 Iniciar ahora</button>
    `;
    alertContainer.appendChild(alertDiv);
  }
}

function iniciarBarridoAliado(allyId) {
  window.currentGestionSubTab = 'barrido';
  window.preselectedAllyId = allyId;
  renderGestion();
}

/* ALLY CRUD DIALOGS */
function showAddAllyModal() {
  let modal = document.getElementById('allyCrudModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'allyCrudModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-box" style="animation: zoomIn 0.3s ease;">
      <div class="modal-title">➕ Agregar Nuevo Aliado</div>
      <div class="form-grid" style="grid-template-columns: 1fr; gap:12px; margin-bottom:20px;">
        <div class="form-group"><label class="form-label">Nombre del Aliado *</label><input class="form-input" id="ca_nombre" type="text" placeholder="Ej: Finca Raíz"/></div>
        <div class="form-group"><label class="form-label">URL Base *</label><input class="form-input" id="ca_url" type="text" placeholder="https://www.fincaraiz.com.co"/></div>
        <div class="form-group"><label class="form-label">Frecuencia de Barrido (Días) *</label><input class="form-input" id="ca_frec" type="number" value="15"/></div>
        <div class="form-group"><label class="form-label">Notas / Comentarios</label><input class="form-input" id="ca_notas" type="text" placeholder="Ej: Scraper principal"/></div>
      </div>
      
      <div class="modal-footer" style="display:flex; gap:10px; justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="document.getElementById('allyCrudModal').classList.remove('active')">Cancelar</button>
        <button class="btn btn-primary" onclick="saveAddAlly()">Guardar Aliado</button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function saveAddAlly() {
  const nombre = document.getElementById('ca_nombre').value.trim();
  const url = document.getElementById('ca_url').value.trim();
  const frec = parseInt(document.getElementById('ca_frec').value) || 15;
  const notas = document.getElementById('ca_notas').value.trim();
  
  if (!nombre || !url) {
    toast('Nombre y URL son requeridos', 'error');
    return;
  }
  
  const aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  aliados.push({
    id: Date.now().toString(),
    nombre: nombre,
    urlBase: url,
    frecuenciaDias: frec,
    ultimoBarrido: '',
    notas: notas
  });
  
  localStorage.setItem('icde_aliados', JSON.stringify(aliados));
  document.getElementById('allyCrudModal').classList.remove('active');
  toast('Aliado agregado con éxito ✓', 'success');
  renderGestion();
}

function showEditAllyModal(id) {
  const aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  const match = aliados.find(a => String(a.id) === String(id));
  if (!match) return;
  
  let modal = document.getElementById('allyCrudModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'allyCrudModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-box" style="animation: zoomIn 0.3s ease;">
      <div class="modal-title">✏️ Editar Aliado</div>
      <div class="form-grid" style="grid-template-columns: 1fr; gap:12px; margin-bottom:20px;">
        <div class="form-group"><label class="form-label">Nombre del Aliado *</label><input class="form-input" id="ca_nombre" type="text" value="${match.nombre}"/></div>
        <div class="form-group"><label class="form-label">URL Base *</label><input class="form-input" id="ca_url" type="text" value="${match.urlBase}"/></div>
        <div class="form-group"><label class="form-label">Frecuencia de Barrido (Días) *</label><input class="form-input" id="ca_frec" type="number" value="${match.frecuenciaDias}"/></div>
        <div class="form-group"><label class="form-label">Notas / Comentarios</label><input class="form-input" id="ca_notas" type="text" value="${match.notas || ''}"/></div>
      </div>
      
      <div class="modal-footer" style="display:flex; gap:10px; justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="document.getElementById('allyCrudModal').classList.remove('active')">Cancelar</button>
        <button class="btn btn-primary" onclick="saveEditAlly('${id}')">Guardar Cambios</button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function saveEditAlly(id) {
  const nombre = document.getElementById('ca_nombre').value.trim();
  const url = document.getElementById('ca_url').value.trim();
  const frec = parseInt(document.getElementById('ca_frec').value) || 15;
  const notas = document.getElementById('ca_notas').value.trim();
  
  if (!nombre || !url) {
    toast('Nombre y URL son requeridos', 'error');
    return;
  }
  
  const aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  const match = aliados.find(a => String(a.id) === String(id));
  if (match) {
    match.nombre = nombre;
    match.urlBase = url;
    match.frecuenciaDias = frec;
    match.notas = notas;
    
    localStorage.setItem('icde_aliados', JSON.stringify(aliados));
    document.getElementById('allyCrudModal').classList.remove('active');
    toast('Aliado actualizado ✓', 'success');
    renderGestion();
  }
}

function deleteAlly(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este aliado?')) return;
  
  let aliados = JSON.parse(localStorage.getItem('icde_aliados') || '[]');
  aliados = aliados.filter(a => String(a.id) !== String(id));
  
  localStorage.setItem('icde_aliados', JSON.stringify(aliados));
  toast('Aliado eliminado', 'success');
  renderGestion();
}




// --- GOOGLE STREET VIEW INTEGRATION ---
function abrirStreetView(lat, lng) {
  // Street View eliminado — abre en Google Maps en nueva pestaña
  window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`, '_blank');
}

// Function to change property popup images
window.popupImagesRegistry = window.popupImagesRegistry || {};
function changePopupImage(code, direction) {
  const images = window.popupImagesRegistry[code];
  if (!images || images.length <= 1) return;
  
  const imgEl = document.getElementById(`popup-img-${code}`);
  const counterEl = document.getElementById(`popup-counter-${code}`);
  if (!imgEl || !counterEl) return;
  
  let currentIndex = parseInt(imgEl.getAttribute('data-index') || '0', 10);
  let newIndex = currentIndex + direction;
  
  if (newIndex < 0) {
    newIndex = images.length - 1;
  } else if (newIndex >= images.length) {
    newIndex = 0;
  }
  
  imgEl.src = images[newIndex];
  imgEl.setAttribute('data-index', newIndex);
  counterEl.textContent = `${newIndex + 1} de ${images.length} ›`;
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeStreetView');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const modal = document.getElementById('streetViewModal');
      const panoramaDiv = document.getElementById('streetViewPanorama');
    });
  }
  initGeminiIdleActions();
});

function showSearchResultPinOnly(lat, lng) {
  if (leafletMap._tempSearchMarker) {
    leafletMap.removeLayer(leafletMap._tempSearchMarker);
  }
  const searchIcon = L.divIcon({
    className: 'google-search-pin-wrap',
    html: `
      <div class="google-search-pin">
        <div class="google-search-pin-circle"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  });
  leafletMap._tempSearchMarker = L.marker([lat, lng], { icon: searchIcon }).addTo(leafletMap);
}

function mostrarBottomCard(lat, lng, main, sub, full) {
  const card = document.getElementById('googleMapsBottomCard');
  if (!card) return;
  
  document.getElementById('bottomCardAddressMain').textContent = main;
  document.getElementById('bottomCardAddressSub').textContent = sub;
  document.getElementById('bottomCardLatLng').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  
  // Set street view preview image
  const staticSvUrl = `https://maps.googleapis.com/maps/api/streetview?size=110x75&scale=2&location=${lat},${lng}&key=AIzaSyDoeGgX0VRgHY1wXjm4Z0SPZp9R4EBkUF0`;
  const imgEl = document.getElementById('bottomCardImg');
  imgEl.src = staticSvUrl;
  imgEl.style.display = 'block';
  
  // Thumbnail click starts Street View
  const thumbEl = document.getElementById('bottomCardThumbnail');
  thumbEl.onclick = () => abrirStreetView(lat, lng);

  // Street View button
  const svBtn = document.getElementById('bottomCardSvBtn');
  if (svBtn) svBtn.onclick = () => abrirStreetView(lat, lng);
  
  // Directions action
  const dirBtn = document.getElementById('bottomCardDirBtn');
  dirBtn.onclick = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(full)}`;
    window.open(url, '_blank');
  };
  
  // Share action (copies coordinates and address)
  const shareBtn = document.getElementById('bottomCardShareBtn');
  shareBtn.onclick = () => {
    const textToCopy = `${main}, ${sub} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast("Dirección copiada al portapapeles", "success");
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };
  
  card.classList.add('active');
}

function cerrarBottomCard() {
  const card = document.getElementById('googleMapsBottomCard');
  if (card) card.classList.remove('active');
  if (leafletMap && leafletMap._tempSearchMarker) {
    leafletMap.removeLayer(leafletMap._tempSearchMarker);
    leafletMap._tempSearchMarker = null;
  }
}

/* ═══════════════════════════════════════════════════════════════
   MÓDULO CONTABILIDAD — ICDE Inmobiliaria
═══════════════════════════════════════════════════════════════ */
function contDeduplicarMovimientos(arr) {
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
}

let contMetas = {"ingMes":20000000,"ingAnual":240000000,"gastoMes":8000000};
try {
  const savedMetas = localStorage.getItem('icde_cont_metas');
  if (savedMetas) {
    contMetas = JSON.parse(savedMetas);
  }
} catch (e) {
  console.error("Error al inicializar contMetas:", e);
}

async function contCargarDatos() {
  if (!CONT_SCRIPT_URL) return;
  if (window.contSyncCount && window.contSyncCount > 0) {
    console.log('Sincronización en curso, omitiendo recarga desde Drive.');
    return;
  }
  try {
    const res = await fetch(CONT_SCRIPT_URL + '?action=getContabilidad&t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.movimientos)) {
        // Combinación inteligente sin duplicados por ID
        const driveIds = new Set(data.movimientos.map(m => String(m.id).trim()));
        const pendingUpload = contMovimientos.filter(m => !m.isAuto && m.isPending && !driveIds.has(String(m.id).trim()));
        
        contMovimientos = contDeduplicarMovimientos([...data.movimientos, ...pendingUpload]);
        localStorage.setItem('icde_contabilidad', JSON.stringify(contMovimientos));
      }
      if (data && data.metas) {
        // Sólo actualizamos metas si tienen datos válidos y no están en 0
        if (data.metas.ingMes > 0 || data.metas.ingAnual > 0) {
          contMetas = data.metas;
          localStorage.setItem('icde_cont_metas', JSON.stringify(contMetas));
        }
      }
      console.log('Datos de contabilidad sincronizados desde Drive.');
    }
  } catch (err) {
    console.error('Error cargando contabilidad de Drive:', err);
  }
}

let contActiveTab = 'flujo';
let contAnoFiltro = new Date().getFullYear();
let contMesFiltro = 0;
let contSortOrder = 'fecha';
let contDetalleMesSortOrder = 'fecha';
let contDetalleMesActivo = null;
let contCharts = {};

let contAuditLog = [];
try {
  contAuditLog = JSON.parse(localStorage.getItem('icde_cont_audit') || '[]');
  if (!Array.isArray(contAuditLog)) contAuditLog = [];
} catch(e) {
  contAuditLog = [];
}

function contRegistrarAuditoria(tipoAccion, antes, despues) {
  const logEntry = {
    id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    tipoAccion: tipoAccion,
    fechaAccion: new Date().toISOString(),
    movimientoId: antes ? String(antes.id) : (despues ? String(despues.id) : ''),
    antes: antes ? { ...antes, historial: undefined } : null,
    despues: despues ? { ...despues, historial: undefined } : null
  };
  contAuditLog.push(logEntry);
  localStorage.setItem('icde_cont_audit', JSON.stringify(contAuditLog));
}

const CONT_MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const CONT_MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CONT_CAT_ICONS = {
  'Venta de Inmueble':'\uD83C\uDFE0','Arriendo':'\uD83D\uDD11','Aval\u00FAos':'\uD83D\uDCCB',
  'Remodelaci\u00F3n':'\uD83D\uDD28','Reparaci\u00F3n':'\uD83D\uDD27','Arquitectura':'\uD83D\uDCD0',
  'Gesti\u00F3n/Administraci\u00F3n':'\uD83D\uDCBC','Consultor\u00EDa':'\uD83D\uDCA1','Otro Servicio':'\u2B50',
  'N\u00F3mina/Personal':'\uD83D\uDC65','Arriendo Oficina':'\uD83C\uDFE2','Marketing':'\uD83D\uDCE3',
  'Servicios P\u00FAblicos':'\uD83D\uDCA1','Impuestos':'\uD83D\uDCDD','Software/Tecnolog\u00EDa':'\uD83D\uDCBB',
  'Inversi\u00F3n':'\uD83D\uDCC8','Aseo/Mantenimiento':'\uD83E\uDDF9','Cafeter\u00EDa':'\u2615','Deudas':'\uD83D\uDCB8','Transporte':'\uD83D\uDE97','Papeler\u00EDa':'\uD83D\uDCCE','Otro Gasto':'\u274C'
};

function contFmt(n){
  if(!n&&n!==0)return'$0';
  return (n<0?'-':'')+'$'+Math.abs(n).toLocaleString('es-CO');
}
function contSave(){
  contMovimientos = contDeduplicarMovimientos(contMovimientos);
  localStorage.setItem('icde_contabilidad', JSON.stringify(contMovimientos));
}
function contSaveMetas(){localStorage.setItem('icde_cont_metas',JSON.stringify(contMetas));}
function contDestroyChart(id){if(contCharts[id]){try{contCharts[id].destroy();}catch(e){}delete contCharts[id];}}
function contSumTipo(lista,tipo){return lista.filter(m=>m.tipo===tipo).reduce((a,m)=>a+(parseFloat(m.monto)||0),0);}

function contObtenerComisionAdministracionEsperada(year, month) {
  if (typeof adminData === 'undefined' || !adminData || !adminData.properties) {
    return 0;
  }
  const monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  let totalEsperado = 0;
  
  adminData.properties.forEach(p => {
    const rent = parseFloat(p.monthly_rent) || 0;
    const paymentsYear = p.payments[year] || [];
    
    paymentsYear.forEach(m => {
      const mIdx = monthsNames.indexOf(m.month.toUpperCase());
      if (mIdx !== -1) {
        if (month === 0 || mIdx === (month - 1)) {
          const st = m.status;
          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE') {
            totalEsperado += rent * 0.10;
          }
        }
      }
    });
  });
  
  return totalEsperado;
}

function contGetParaAno(year) {
  let lista = contMovimientos.filter(m => {
    const mAno = m.ano ? parseInt(m.ano) : (m.fecha ? parseInt(m.fecha.split('-')[0]) : null);
    return mAno === year;
  });

  if (typeof adminData !== 'undefined' && adminData && adminData.properties) {
    const monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    adminData.properties.forEach(p => {
      const rent = parseFloat(p.monthly_rent) || 0;
      const comVal = rent * 0.10;
      if (comVal <= 0) return;
      
      const paymentsYear = p.payments[year] || [];
      paymentsYear.forEach(m => {
        const mIdx = monthsNames.indexOf(m.month.toUpperCase());
        if (mIdx !== -1) {
          const st = m.status;
          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE') {
            const propName = p.name || 'Propiedad';
            const mIdx1Based = mIdx + 1;
            lista.push({
              id: 'AUTO-ADMIN-COMISION-' + (p.id || propName.replace(/\s+/g, '-')) + '-' + year + '-' + mIdx1Based,
              tipo: 'ingreso',
              categoria: 'Gestión/Administración',
              descripcion: 'Comisión Administración Esperada - ' + propName,
              monto: comVal,
              fecha: year + '-' + String(mIdx1Based).padStart(2, '0') + '-01',
              mes: mIdx1Based,
              ano: year,
              notas: 'Generado automáticamente para el inmueble: ' + propName,
              isAuto: true
            });
          }
        }
      });
    });
  }
  return lista;
}

function contGetFiltrado(){
  let lista = contGetParaAno(contAnoFiltro);
  if (contMesFiltro > 0) {
    lista = lista.filter(m => parseInt(m.mes) === contMesFiltro);
  }
  return lista;
}

async function renderContabilidad(){
  if (window.contFiltersInitialized === undefined) {
    contAnoFiltro = new Date().getFullYear();
    contMesFiltro = new Date().getMonth() + 1;
    window.contFiltersInitialized = true;
  }
  const c=document.getElementById('mainContent');
  
  // Dibujar estructura básica de contabilidad
  const syncMsg = CONT_SCRIPT_URL ? 'Sincronizando con Drive... 🔄' : 'Modo Local 💻';
  c.innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div>
      <div class="section-title" style="font-size:1.3rem;">\uD83D\uDCB0 Contabilidad</div>
      <div style="font-size:12px;color:var(--muted);margin-top:3px;display:flex;align-items:center;gap:6px;">
        <span>Control financiero de ICDE Inmobiliaria</span>
        <span id="contSyncIndicator" style="background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:12px;color:#aaa;font-size:10px;font-weight:600;">${syncMsg}</span>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:6px 12px;">
        <span style="font-size:12px;color:var(--muted);">A\u00F1o:</span>
        <button onclick="contCambiarAno(-1)" style="background:none;border:none;color:var(--gold);cursor:pointer;font-size:16px;padding:0 4px;">\u25C4</button>
        <span id="contAnoLabel" style="font-size:14px;font-weight:700;color:#fff;min-width:40px;text-align:center;">${contAnoFiltro}</span>
        <button onclick="contCambiarAno(1)" style="background:none;border:none;color:var(--gold);cursor:pointer;font-size:16px;padding:0 4px;">\u25BA</button>
      </div>
      <select id="contMesSel" class="form-input" style="width:auto;padding:8px 12px;font-size:13px;" onchange="contCambiarMes(this.value)">
        <option value="0">Todos los meses</option>
        ${CONT_MESES_FULL.map((m,i)=>'<option value="'+(i+1)+'"'+(contMesFiltro===i+1?' selected':'')+'>'+m+'</option>').join('')}
      </select>
      <button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Agregar Movimiento</button>
      <button class="btn btn-secondary btn-sm" onclick="contAbrirMetas()" title="Metas">\uD83C\uDFAF Metas</button>
    </div>
  </div>
  <div class="cont-hero" id="contHero"></div>
  <div class="cont-tabs">
    <button class="cont-tab-btn${contActiveTab==='flujo'?' active':''}" onclick="contSwitchTab('flujo')">\uD83D\uDCC8 Flujo Mensual</button>
    <button class="cont-tab-btn${contActiveTab==='inversiones'?' active':''}" onclick="contSwitchTab('inversiones')">\uD83D\uDC8E Inversiones</button>
    <button class="cont-tab-btn${contActiveTab==='movimientos'?' active':''}" onclick="contSwitchTab('movimientos')">\uD83D\uDCCB Movimientos</button>
  </div>
  <div id="contTabContent"></div>`;
  
  // Render inicial de héroe rápido (con caché/local)
  contRenderHero(); contRenderMetas(); contRenderTabContent();
  
  // Carga asíncrona en segundo plano desde Drive
  if (CONT_SCRIPT_URL) {
    try {
      await contCargarDatos();
      const indicator = document.getElementById('contSyncIndicator');
      if (indicator) {
        indicator.textContent = 'Sincronizado con Drive ☁️';
        indicator.style.color = '#22c55e';
        indicator.style.background = 'rgba(34,197,94,0.1)';
      }
      // Re-renderizar paneles con los datos actualizados
      contRenderHero(); contRenderMetas(); contRenderTabContent();
    } catch(err) {
      console.warn("Fallo de sincronización al renderizar contabilidad:", err);
      const indicator = document.getElementById('contSyncIndicator');
      if (indicator) {
        indicator.textContent = 'Error de Conexión ⚠️';
        indicator.style.color = '#ef4444';
        indicator.style.background = 'rgba(239,68,68,0.1)';
      }
    }
  }
}

function contCambiarAno(d){contAnoFiltro+=d;const el=document.getElementById('contAnoLabel');if(el)el.textContent=contAnoFiltro;contRenderHero();contRenderMetas();contRenderTabContent();}
function contCambiarMes(v){contMesFiltro=parseInt(v)||0;contRenderHero();contRenderMetas();contRenderTabContent();}

function contSwitchTab(tab){
  if (tab === 'pareto') {
    tab = 'inversiones';
    contMostrarParetoGraficas = true;
  }
  contActiveTab=tab;
  document.querySelectorAll('.cont-tab-btn').forEach((btn,i)=>{
    const tabs=['flujo','inversiones','movimientos'];
    btn.classList.toggle('active',tabs[i]===tab);
  });
  contRenderTabContent();
}

function contRenderHero(){
  const lista=contGetFiltrado();
  const ingresos=contSumTipo(lista,'ingreso');
  const egresos=contSumTipo(lista,'egreso');
  const utilidad=ingresos-egresos;
  const margen=ingresos>0?((utilidad/ingresos)*100).toFixed(1):0;
  const pMeta=contMetas.ingMes>0?Math.round((ingresos/contMetas.ingMes)*100):0;
  const el=document.getElementById('contHero');if(!el)return;
  el.innerHTML=
    '<div class="cont-hero-card" style="--card-accent:#22c55e;"><span class="ch-icon">\uD83D\uDCB9</span><div class="ch-lbl">Ingresos Totales</div><div class="ch-val">'+contFmt(ingresos)+'</div><div class="ch-sub">'+lista.filter(m=>m.tipo==='ingreso').length+' transacciones</div></div>'+
    '<div class="cont-hero-card" style="--card-accent:#ef4444;"><span class="ch-icon">\uD83D\uDCC9</span><div class="ch-lbl">Egresos Totales</div><div class="ch-val">'+contFmt(egresos)+'</div><div class="ch-sub">'+lista.filter(m=>m.tipo==='egreso').length+' transacciones</div></div>'+
    '<div class="cont-hero-card" style="--card-accent:'+(utilidad>=0?'#22c55e':'#ef4444')+'"><span class="ch-icon">'+(utilidad>=0?'\uD83D\uDCC8':'\uD83D\uDCC9')+'</span><div class="ch-lbl">Utilidad Neta</div><div class="ch-val" style="color:'+(utilidad>=0?'#22c55e':'#ef4444')+'">'+contFmt(utilidad)+'</div><div class="ch-sub">Margen: '+margen+'%</div></div>'+
    '<div class="cont-hero-card" style="--card-accent:var(--gold)"><span class="ch-icon">\uD83D\uDCCA</span><div class="ch-lbl">Margen</div><div class="ch-val" style="color:var(--gold)">'+margen+'%</div><div class="ch-sub">'+(utilidad>=0?'\u2705 Positivo':'\u26A0\uFE0F Negativo')+'</div></div>'+
    '<div class="cont-hero-card" style="--card-accent:#3b82f6"><span class="ch-icon">\uD83C\uDFAF</span><div class="ch-lbl">Meta Mes</div><div class="ch-val" style="color:#3b82f6">'+pMeta+'%</div><div class="ch-sub">Meta: '+contFmt(contMetas.ingMes)+'</div></div>';
}

function contRenderMetas(){
  return;
}

function contRenderTabContent(){
  const el=document.getElementById('contTabContent');if(!el)return;
  Object.keys(contCharts).forEach(k=>contDestroyChart(k));
  if(contActiveTab==='resumen')contRenderResumen(el);
  else if(contActiveTab==='flujo')contRenderFlujo(el);
  else if(contActiveTab==='pareto')contRenderPareto(el);
  else if(contActiveTab==='inversiones')contRenderInversiones(el);
  else if(contActiveTab==='movimientos')contRenderMovimientos(el);
}

function contRenderResumen(el){
  const lista=contGetFiltrado();
  const ingresos=contSumTipo(lista,'ingreso');
  const egresos=contSumTipo(lista,'egreso');
  const catIng={};lista.filter(m=>m.tipo==='ingreso').forEach(m=>{catIng[m.categoria]=(catIng[m.categoria]||0)+parseFloat(m.monto||0);});
  const catEgr={};lista.filter(m=>m.tipo==='egreso').forEach(m=>{catEgr[m.categoria]=(catEgr[m.categoria]||0)+parseFloat(m.monto||0);});
  const sI=Object.entries(catIng).sort((a,b)=>parseFloat(b[1]||0)-parseFloat(a[1]||0));
  const sE=Object.entries(catEgr).sort((a,b)=>parseFloat(b[1]||0)-parseFloat(a[1]||0));
  const ciC=['#22c55e','#16a34a','#4ade80','#86efac','#d4a84b','#f97316','#3b82f6','#a855f7'];
  const ceC=['#ef4444','#dc2626','#f87171','#fca5a5','#f97316','#a855f7','#eab308','#888'];
  const txList = [...lista];
  if (contSortOrder === 'fecha') {
    txList.sort((a,b) => new Date(b.fecha||0) - new Date(a.fecha||0));
  } else if (contSortOrder === 'tipo') {
    txList.sort((a,b) => {
      const tComp = (a.tipo||'').localeCompare(b.tipo||'');
      if (tComp !== 0) return tComp;
      const cComp = (a.categoria||'').localeCompare(b.categoria||'');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha||0) - new Date(a.fecha||0);
    });
  } else if (contSortOrder === 'categoria') {
    txList.sort((a,b) => {
      const cComp = (a.categoria||'').localeCompare(b.categoria||'');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha||0) - new Date(a.fecha||0);
    });
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
  '<div class="cont-panel"><div class="cont-panel-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;"><div class="cont-panel-title">'+panelMovsTitle+'</div>'+'<div style="display:flex;gap:8px;align-items:center;"><span style="font-size:12px;color:var(--muted);white-space:nowrap;">Ordenar por:</span><select class="form-input" style="width:auto;height:32px;padding:0 8px;background:#18181b;border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:12px;border-radius:8px;cursor:pointer;color-scheme:dark;" onchange="contCambiarOrden(this.value)"><option value="fecha"'+(contSortOrder==='fecha'?' selected':'')+'>\uD83D\uDCC5 Fecha</option><option value="tipo"'+(contSortOrder==='tipo'?' selected':'')+'>\uD83D\uDD04 Tipo</option><option value="categoria"'+(contSortOrder==='categoria'?' selected':'')+'>\uD83C\uDFF7\uFE0F Categor\u00EDa</option><option value="precio"'+(contSortOrder==='precio'?' selected':'')+'>\uD83D\uDCB0 Precio</option></select><button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Nuevo</button></div></div>'+
  '<div class="cont-panel-body">'+(lista.length===0?'<div class="cont-empty">Ninguno a\u00FAn.<br><br><button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Primero</button></div>':
    '<div class="cont-tx-list">'+txList.map(function(m){return'<div class="cont-tx-item" '+(m.isAuto?'':'onclick="contEditarMovimiento(\''+m.id+'\')" style="cursor:pointer;"')+'><div class="cont-tx-icon '+m.tipo+'">'+(CONT_CAT_ICONS[m.categoria]||'\uD83D\uDCB0')+'</div><div class="cont-tx-info"><div class="cont-tx-desc">'+(m.descripcion||m.categoria)+'</div><div class="cont-tx-cat">'+m.categoria+' \u00B7 '+(m.fecha||'\u2014')+'</div></div><div style="text-align:right;"><div class="cont-tx-amount '+m.tipo+'">'+(m.tipo==='ingreso'?'+':'-')+contFmt(parseFloat(m.monto||0))+'</div><div class="cont-tx-date">'+CONT_MESES_FULL[(parseInt(m.mes)||1)-1]+'</div></div></div>';}).join('')+'</div>')+'</div></div>';
  setTimeout(function(){
    try {
      if(ingresos>0&&sI.length){const ctx=document.getElementById('chartIngCat');if(ctx){contCharts['chartIngCat']=new Chart(ctx,{type:'doughnut',data:{labels:sI.map(function(e){return e[0];}),datasets:[{data:sI.map(function(e){return e[1];}),backgroundColor:ciC,borderWidth:2,borderColor:'#18181b'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+contFmt(ctx.raw);}}}},cutout:'62%'}});}}
      if(egresos>0&&sE.length){const ctx=document.getElementById('chartEgrCat');if(ctx){contCharts['chartEgrCat']=new Chart(ctx,{type:'doughnut',data:{labels:sE.map(function(e){return e[0];}),datasets:[{data:sE.map(function(e){return e[1];}),backgroundColor:ceC,borderWidth:2,borderColor:'#18181b'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+contFmt(ctx.raw);}}}},cutout:'62%'}});}}
    } catch (e) {
      console.warn("No se pudieron cargar los gráficos de resumen:", e);
    }
  },80);
}

function contActualizarMesContableDesdeFecha(fechaVal){
  if (!fechaVal) return;
  const parts = fechaVal.split('-');
  if (parts.length === 3) {
    const mes = parseInt(parts[1]);
    const sel = document.getElementById('contMovMes');
    if (sel && !isNaN(mes)) {
      sel.value = String(mes);
    }
  }
}

function contCambiarOrdenDetalleMes(val) {
  contDetalleMesSortOrder = val;
  contSeleccionarMesYVerMovimientos();
}

function contSeleccionarMesYVerMovimientos(mes){
  if (mes !== undefined) {
    contDetalleMesActivo = mes;
  }
  const mesInt = parseInt(contDetalleMesActivo) || 1;
  const year = contAnoFiltro;
  
  // Set modal title
  document.getElementById('contDetalleMesTitle').textContent = '📋 Movimientos de ' + CONT_MESES_FULL[mesInt - 1] + ' ' + year;
  
  // Sync sorting dropdown state if present
  const sortSelect = document.getElementById('contDetalleMesSort');
  if (sortSelect) {
    sortSelect.value = contDetalleMesSortOrder;
  }
  
  // Filter movements
  const listaAno = contGetParaAno(year);
  const listaMes = listaAno.filter(function(m) {
    return parseInt(m.mes) === mesInt;
  });
  
  // Apply sorting
  if (contDetalleMesSortOrder === 'fecha') {
    listaMes.sort(function(a, b) {
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  } else if (contDetalleMesSortOrder === 'tipo') {
    listaMes.sort(function(a, b) {
      const tComp = (a.tipo || '').localeCompare(b.tipo || '');
      if (tComp !== 0) return tComp;
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  } else if (contDetalleMesSortOrder === 'categoria') {
    listaMes.sort(function(a, b) {
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  } else if (contDetalleMesSortOrder === 'precio') {
    listaMes.sort(function(a, b) {
      return (parseFloat(b.monto || 0)) - (parseFloat(a.monto || 0));
    });
  }
  
  const body = document.getElementById('contDetalleMesBody');
  if (!body) return;
  
  if (listaMes.length === 0) {
    body.innerHTML = '<div class="cont-empty" style="padding:40px; text-align:center; color:var(--muted);">Sin movimientos registrados en este mes.</div>';
  } else {
    body.innerHTML = 
      '<table style="width:100%; border-collapse:collapse; font-size:13px;">' +
      '<thead>' +
        '<tr style="background:rgba(212,168,75,0.04); border-bottom:1px solid rgba(212,168,75,0.15);">' +
          '<th style="padding:10px 12px; text-align:left; color:var(--gold); font-size:11px; text-transform:uppercase;">Fecha</th>' +
          '<th style="padding:10px 12px; text-align:left; color:var(--gold); font-size:11px; text-transform:uppercase;">Categoría</th>' +
          '<th style="padding:10px 12px; text-align:left; color:var(--gold); font-size:11px; text-transform:uppercase;">Descripción</th>' +
          '<th style="padding:10px 12px; text-align:right; color:var(--gold); font-size:11px; text-transform:uppercase;">Monto</th>' +
          '<th style="padding:10px 12px; text-align:center; color:var(--gold); font-size:11px; text-transform:uppercase;">Acc.</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        listaMes.map(function(m) {
          const catIcon = CONT_CAT_ICONS[m.categoria] || '•';
          const montoColor = m.tipo === 'ingreso' ? '#22c55e' : '#ef4444';
          const montoSign = m.tipo === 'ingreso' ? '+' : '-';
          const editBtn = m.isAuto ? '<span style="color:#555; font-size:11px;">Auto</span>' : 
            '<button onclick="contEditarMovimiento(\'' + m.id + '\')" style="background:none; border:1px solid rgba(255,255,255,0.1); border-radius:7px; color:#888; padding:3px 6px; cursor:pointer; font-size:11px;" onmouseover="this.style.borderColor=\'var(--gold)\'; this.style.color=\'var(--gold)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.1)\'; this.style.color=\'#888\'">✏️</button>';
          
          return '<tr style="border-bottom:1px solid rgba(255,255,255,0.03);" onmouseover="this.style.background=\'rgba(255,255,255,0.025)\'" onmouseout="this.style.background=\'\'">' +
            '<td style="padding:8px 12px; color:#888; white-space:nowrap;">' + (m.fecha || '—') + '</td>' +
            '<td style="padding:8px 12px; color:#ccc;">' + catIcon + ' ' + m.categoria + '</td>' +
            '<td style="padding:8px 12px; color:#fff; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + (m.descripcion || '') + '">' + (m.descripcion || '—') + '</td>' +
            '<td style="padding:8px 12px; text-align:right; color:' + montoColor + '; font-weight:700;">' + montoSign + contFmt(parseFloat(m.monto || 0)) + '</td>' +
            '<td style="padding:8px 12px; text-align:center;">' + editBtn + '</td>' +
          '</tr>';
        }).join('') +
      '</tbody>' +
      '</table>';
  }
  
  // Show the modal
  document.getElementById('modalContDetalleMes').classList.add('open');
}

let contMostrarGraficas = false;
function contToggleGraficas(){
  contMostrarGraficas = !contMostrarGraficas;
  contRenderTabContent();
}

function contRenderFlujo(el){
  const listaAno=contGetParaAno(contAnoFiltro);
  const md=CONT_MESES.map(function(label,idx){const mn=idx+1;const ml=listaAno.filter(function(m){return parseInt(m.mes)===mn;});return{label:label,ingreso:contSumTipo(ml,'ingreso'),egreso:contSumTipo(ml,'egreso'),utilidad:contSumTipo(ml,'ingreso')-contSumTipo(ml,'egreso')};});
  const ti=md.reduce(function(a,m){return a+m.ingreso;},0);
  const te=md.reduce(function(a,m){return a+m.egreso;},0);
  const tu=ti-te;

  const lista=contGetFiltrado();
  const ingresos=contSumTipo(lista,'ingreso');
  const egresos=contSumTipo(lista,'egreso');
  const catIng={};lista.filter(m=>m.tipo==='ingreso').forEach(m=>{catIng[m.categoria]=(catIng[m.categoria]||0)+parseFloat(m.monto||0);});
  const catEgr={};lista.filter(m=>m.tipo==='egreso').forEach(m=>{catEgr[m.categoria]=(catEgr[m.categoria]||0)+parseFloat(m.monto||0);});
  const sI=Object.entries(catIng).sort((a,b)=>parseFloat(b[1]||0)-parseFloat(a[1]||0));
  const sE=Object.entries(catEgr).sort((a,b)=>parseFloat(b[1]||0)-parseFloat(a[1]||0));
  const ciC=['#22c55e','#16a34a','#4ade80','#86efac','#d4a84b','#f97316','#3b82f6','#a855f7'];
  const ceC=['#ef4444','#dc2626','#f87171','#fca5a5','#f97316','#a855f7','#eab308','#888'];

  el.innerHTML=
  '<div id="contChartsWrapper" style="display:'+(contMostrarGraficas?'block':'none')+';">'+
    '<div class="cont-layout" style="margin-bottom:20px;">'+
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
    '<div class="cont-panel" style="margin-bottom:20px;"><div class="cont-panel-header"><div class="cont-panel-title">\uD83D\uDCC8 Flujo Caja Mensual \u2014 '+contAnoFiltro+'</div></div><div class="cont-panel-body"><div class="cont-chart-wrap" style="height:310px;"><canvas id="chartFlujo"></canvas></div></div></div>'+
  '</div>'+
  '<div class="cont-panel"><div class="cont-panel-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"><div class="cont-panel-title" style="display:flex; align-items:center; gap:8px;">📋 Detalle mensual año '+contAnoFiltro+'<div style="display:inline-flex; align-items:center; gap:4px; margin-left:6px; background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);"><button onclick="contCambiarAno(-1)" style="background:none; border:none; color:var(--gold); cursor:pointer; font-size:12px; padding:0 2px;">◄</button><span style="font-size:12px; font-weight:700; color:#fff; min-width:30px; text-align:center;">'+contAnoFiltro+'</span><button onclick="contCambiarAno(1)" style="background:none; border:none; color:var(--gold); cursor:pointer; font-size:12px; padding:0 2px;">►</button></div></div><div style="display:flex; align-items:center; gap:12px;"><button onclick="contToggleGraficas()" style="background:linear-gradient(180deg, #d9ac3b 0%, #9e751d 100%); border:1px solid #785614; color:#0f0f0f; font-size:12px; font-weight:700; font-family:system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; letter-spacing:0.2px; padding:4px 12px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; box-shadow:0 3px 6px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.45); transition:all 0.15s ease;" onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'">📊 Gráficas</button><span style="font-size:12px;color:'+(tu>=0?'#22c55e':'#ef4444')+';font-weight:700;">Utilidad A\u00F1o: '+contFmt(tu)+'</span></div></div>'+
  '<div class="cont-panel-body" style="padding:0;"><table style="width:100%;border-collapse:collapse;font-size:13px;">'+
  '<thead><tr style="background:rgba(212,168,75,0.04);border-bottom:1px solid rgba(212,168,75,0.15);"><th style="padding:12px 16px;text-align:left;color:var(--gold);font-size:11px;text-transform:uppercase;">Mes</th><th style="padding:12px 16px;text-align:right;color:var(--gold);font-size:11px;text-transform:uppercase;">Ingresos</th><th style="padding:12px 16px;text-align:right;color:var(--gold);font-size:11px;text-transform:uppercase;">Egresos</th><th style="padding:12px 16px;text-align:right;color:var(--gold);font-size:11px;text-transform:uppercase;">Utilidad</th><th style="padding:12px 16px;text-align:right;color:var(--gold);font-size:11px;text-transform:uppercase;">Margen</th></tr></thead>'+
  '<tbody>'+md.map(function(m,i){return'<tr style="border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer;" onclick="contSeleccionarMesYVerMovimientos('+(i+1)+')" onmouseover="this.style.background=\'rgba(255,255,255,0.04)\'" onmouseout="this.style.background=\'\'"><td style="padding:10px 16px;color:#fff;opacity:'+(m.ingreso||m.egreso?1:0.4)+';">'+CONT_MESES_FULL[i]+'</td><td style="padding:10px 16px;text-align:right;color:#22c55e;font-weight:600;">'+(m.ingreso?contFmt(m.ingreso):'\u2014')+'</td><td style="padding:10px 16px;text-align:right;color:#ef4444;font-weight:600;">'+(m.egreso?contFmt(m.egreso):'\u2014')+'</td><td style="padding:10px 16px;text-align:right;color:'+(m.utilidad>=0?'#22c55e':'#ef4444')+';font-weight:700;">'+(m.ingreso||m.egreso?contFmt(m.utilidad):'\u2014')+'</td><td style="padding:10px 16px;text-align:right;color:#888;">'+(m.ingreso>0?((m.utilidad/m.ingreso)*100).toFixed(0)+'%':'\u2014')+'</td></tr>';}).join('')+
  '<tr style="background:rgba(212,168,75,0.05);border-top:2px solid rgba(212,168,75,0.2);"><td style="padding:12px 16px;font-weight:800;color:var(--gold);">TOTAL</td><td style="padding:12px 16px;text-align:right;color:#22c55e;font-weight:800;">'+contFmt(ti)+'</td><td style="padding:12px 16px;text-align:right;color:#ef4444;font-weight:800;">'+contFmt(te)+'</td><td style="padding:12px 16px;text-align:right;color:'+(tu>=0?'#22c55e':'#ef4444')+';font-weight:800;">'+contFmt(tu)+'</td><td style="padding:12px 16px;text-align:right;color:var(--gold);font-weight:800;">'+(ti>0?((tu/ti)*100).toFixed(0)+'%':'\u2014')+'</td></tr>'+
  '</tbody></table></div></div>';
  setTimeout(function(){
    try {
      if(ingresos>0&&sI.length){const ctx=document.getElementById('chartIngCat');if(ctx){contCharts['chartIngCat']=new Chart(ctx,{type:'doughnut',data:{labels:sI.map(function(e){return e[0];}),datasets:[{data:sI.map(function(e){return e[1];}),backgroundColor:ciC,borderWidth:2,borderColor:'#18181b'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+contFmt(ctx.raw);}}}},cutout:'62%'}});}}
      if(egresos>0&&sE.length){const ctx=document.getElementById('chartEgrCat');if(ctx){contCharts['chartEgrCat']=new Chart(ctx,{type:'doughnut',data:{labels:sE.map(function(e){return e[0];}),datasets:[{data:sE.map(function(e){return e[1];}),backgroundColor:ceC,borderWidth:2,borderColor:'#18181b'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return' '+contFmt(ctx.raw);}}}},cutout:'62%'}});}}
      const ctx=document.getElementById('chartFlujo');
      if(ctx){
        contCharts['chartFlujo']=new Chart(ctx,{
          type:'bar',
          data:{
            labels:CONT_MESES,
            datasets:[
              {
                label:'Barra Mayor',
                data:md.map(function(m){return Math.max(m.ingreso, m.egreso);}),
                backgroundColor:md.map(function(m){return m.ingreso >= m.egreso ? '#22c55e' : '#ef4444';}),
                borderColor:md.map(function(m){return m.ingreso >= m.egreso ? '#22c55e' : '#ef4444';}),
                borderWidth:0,
                borderRadius:6,
                borderSkipped:false,
                barThickness:34,
                order:2
              },
              {
                label:'Barra Menor',
                data:md.map(function(m){return Math.min(m.ingreso, m.egreso);}),
                backgroundColor:md.map(function(m){return m.ingreso >= m.egreso ? '#ef4444' : '#22c55e';}),
                borderColor:md.map(function(m){return m.ingreso >= m.egreso ? '#ef4444' : '#22c55e';}),
                borderWidth:0,
                borderRadius:6,
                borderSkipped:false,
                barThickness:34,
                order:1
              }
            ]
          },
          options:{
            responsive:true,
            maintainAspectRatio:false,
            grouped:false,
            interaction:{mode:'index',intersect:false},
            plugins:{
              legend:{display:false},
              tooltip:{
                backgroundColor:'#121212',
                titleColor:'#fff',
                bodyColor:'#ccc',
                borderColor:'rgba(255,255,255,0.08)',
                borderWidth:1,
                padding:10,
                callbacks:{
                  title:function(items){return items[0]?items[0].label:'';},
                  label:function(ctx){
                    if(ctx.datasetIndex!==0) return null;
                    const m=md[ctx.dataIndex];
                    return [
                      ' 🔵 Ingresos (Total): '+contFmt(m.ingreso),
                      ' 🔴 Egresos (Gastos): '+contFmt(m.egreso),
                      ' 🟢 Utilidad (Ganancia): '+contFmt(m.utilidad)
                    ];
                  }
                }
              }
            },
            scales:{
              x:{
                stacked:false,
                grid:{
                  color:'rgba(255,255,255,0.035)',
                  borderDash:[4, 4],
                  drawTicks:false
                },
                ticks:{
                  color:'#888',
                  font:{size:11, family:'Outfit, sans-serif'}
                }
              },
              y:{
                stacked:false,
                grid:{
                  color:'rgba(255,255,255,0.035)',
                  borderDash:[4, 4],
                  drawTicks:false
                },
                ticks:{
                  color:'#888',
                  font:{size:11, family:'Outfit, sans-serif'},
                  callback:function(v){return contFmt(v);}
                },
                beginAtZero:true
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn("No se pudo cargar el gráfico de flujo:", e);
    }
  },80);
}

function contRenderPareto(el){
  const lista=contGetFiltrado();
  const ingresos=lista.filter(function(m){return m.tipo==='ingreso';});
  const totalIng=ingresos.reduce(function(a,m){return a+parseFloat(m.monto||0);},0);
  const catMap={};ingresos.forEach(function(m){if(!catMap[m.categoria])catMap[m.categoria]={total:0,count:0};catMap[m.categoria].total+=parseFloat(m.monto||0);catMap[m.categoria].count++;});
  const sortedCats=Object.entries(catMap).sort(function(a,b){return b[1].total-a[1].total;});
  let acum=0;
  const pd=sortedCats.map(function(entry){const cat=entry[0];const data=entry[1];acum+=data.total;const pct=totalIng>0?(data.total/totalIng*100):0;const pctAcum=totalIng>0?(acum/totalIng*100):0;return{cat:cat,total:data.total,count:data.count,pct:pct,pctAcum:pctAcum,is80:pctAcum<=80.1};});
  const n80=Math.max(1,(pd.findIndex(function(p){return p.pctAcum>=80;}))+1);
  el.innerHTML=
  '<div class="cont-panel">'+
  '<div class="cont-panel-header"><div class="cont-panel-title">\u2696\uFE0F An\u00E1lisis Pareto</div><span style="font-size:12px;color:var(--muted);">'+n80+' '+(n80===1?'categor\u00EDa genera':'categor\u00EDas generan')+' el 80%</span></div>'+
  '<div class="cont-panel-body">'+
  (totalIng===0?'<div class="cont-empty">Sin ingresos para analizar.</div>':
    '<div style="background:rgba(212,168,75,0.08);border:1px solid rgba(212,168,75,0.2);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;">\uD83C\uDFAF <strong style="color:var(--gold);">Regla 80/20:</strong> <span style="color:#ccc;">Las <strong style="color:#fff;">'+n80+'</strong> categor\u00EDas m\u00E1s rentables generan el <strong style="color:#22c55e;">80%</strong> de tus ingresos.</span></div>'+
    '<div class="cont-chart-wrap" style="height:280px;"><canvas id="chartPareto"></canvas></div>'+
    '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:16px;"><thead><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><th style="padding:8px 10px;text-align:left;color:var(--gold);font-size:10px;text-transform:uppercase;">Categor\u00EDa</th><th style="padding:8px 10px;text-align:right;color:var(--gold);font-size:10px;text-transform:uppercase;">Ingresos</th><th style="padding:8px 10px;text-align:right;color:var(--gold);font-size:10px;text-transform:uppercase;">%</th><th style="padding:8px 10px;text-align:right;color:var(--gold);font-size:10px;text-transform:uppercase;">% Acum.</th><th style="padding:8px 10px;text-align:center;color:var(--gold);font-size:10px;text-transform:uppercase;">Impacto</th></tr></thead>'+
    '<tbody>'+pd.map(function(p){return'<tr style="border-bottom:1px solid rgba(255,255,255,0.03);background:'+(p.is80?'rgba(34,197,94,0.04)':'')+'"><td style="padding:8px 10px;color:#fff;font-weight:'+(p.is80?700:400)+';">'+(CONT_CAT_ICONS[p.cat]||'\u2022')+' '+p.cat+'</td><td style="padding:8px 10px;text-align:right;color:#22c55e;font-weight:600;">'+contFmt(p.total)+'</td><td style="padding:8px 10px;text-align:right;color:#ccc;">'+p.pct.toFixed(1)+'%</td><td style="padding:8px 10px;text-align:right;color:'+(p.pctAcum<=80?'#22c55e':'#888')+';">'+p.pctAcum.toFixed(1)+'%</td><td style="padding:8px 10px;text-align:center;">'+(p.is80?'<span style="background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;">\u2B50 VITAL</span>':'<span style="color:#555;font-size:10px;">Complementario</span>')+'</td></tr>';}).join('')+'</tbody></table>')+'</div></div>';
  setTimeout(function(){
    try {
      if(totalIng>0&&pd.length){const ctx=document.getElementById('chartPareto');if(ctx){const cols=pd.map(function(p){return p.is80?'rgba(34,197,94,0.75)':'rgba(100,100,100,0.45)';});contCharts['chartPareto']=new Chart(ctx,{type:'bar',data:{labels:pd.map(function(p){return p.cat;}),datasets:[{label:'Ingresos',data:pd.map(function(p){return p.total;}),backgroundColor:cols,borderWidth:1.5,borderRadius:5,order:2},{label:'% Acumulado',data:pd.map(function(p){return p.pctAcum;}),type:'line',borderColor:'#d4a84b',backgroundColor:'rgba(212,168,75,0.08)',borderWidth:2,pointRadius:4,tension:0.3,yAxisID:'y1',order:1}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.datasetIndex===0?' '+contFmt(ctx.raw):' '+ctx.raw.toFixed(1)+'%';}}}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#888',font:{size:10},maxRotation:30}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#888',font:{size:10},callback:function(v){return contFmt(v);}},beginAtZero:true},y1:{position:'right',min:0,max:100,grid:{display:false},ticks:{color:'#d4a84b',font:{size:10},callback:function(v){return v+'%';}}}}}});}}
    } catch (e) {
      console.warn("No se pudo cargar el gráfico de Pareto:", e);
    }
  },80);
}

let contMostrarParetoGraficas = false;
function contToggleParetoGraficas(){
  contMostrarParetoGraficas = !contMostrarParetoGraficas;
  contRenderTabContent();
}

let contInversionesCustom = null;

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
      '<button onclick="contAbrirModalInversion(null)" style="background:var(--gold); border:none; color:#121212; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 6px rgba(0,0,0,0.4); transition:all 0.15s ease;" onmouseover="this.style.filter='brightness(1.15)'" onmouseout="this.style.filter=''">➕ Agregar Inversión</button>'+
      '<button onclick="contToggleParetoGraficas()" style="background:linear-gradient(180deg, #d9ac3b 0%, #9e751d 100%); border:1px solid #785614; color:#0f0f0f; font-size:12px; font-weight:700; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing:0.2px; padding:6px 16px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 6px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.45); transition:all 0.15s ease;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">📊 Gráficas</button>'+
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
          (inv.precio !== undefined ? '<button onclick="contAbrirModalInversion(''+inv.id+'')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--gold); cursor:pointer; font-size:11px; width:24px; height:24px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; transition:all 0.2s;" title="Editar o eliminar inversión" onmouseover="this.style.background='rgba(212,168,75,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">✏️</button>' : '')+
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

function contCambiarOrden(val){
  contSortOrder = val;
  contRenderTabContent();
}

function contFormatearFechaHora(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hr = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return y + '-' + m + '-' + day + ' ' + hr + ':' + min;
  } catch (e) {
    return '';
  }
}

function contVerHistorial(id) {
  const logs = contAuditLog.filter(log => String(log.movimientoId) === String(id));
  if (logs.length === 0) {
    toast('No hay historial de cambios para este movimiento', 'info');
    return;
  }
  
  const contentEl = document.getElementById('contHistorialContent');
  if (!contentEl) return;
  
  // Sort logs newest first
  logs.sort((a, b) => new Date(b.fechaAccion) - new Date(a.fechaAccion));
  
  let html = '';
  
  logs.forEach((log, idx) => {
    const diffs = [];
    const fields = [
      { name: 'Fecha', key: 'fecha' },
      { name: 'Tipo', key: 'tipo' },
      { name: 'Categoría', key: 'categoria' },
      { name: 'Descripción', key: 'descripcion' },
      { name: 'Monto', key: 'monto', fmt: v => contFmt(parseFloat(v || 0)) },
      { name: 'Mes Contable', key: 'mes', fmt: v => CONT_MESES_FULL[(parseInt(v) || 1) - 1] },
      { name: 'Notas', key: 'notas' }
    ];
    
    const stateBefore = log.antes || {};
    const stateAfter = log.despues || {};
    
    fields.forEach(f => {
      const valBefore = stateBefore[f.key] || '';
      const valAfter = stateAfter[f.key] || '';
      
      const beforeStr = f.fmt ? f.fmt(valBefore) : String(valBefore);
      const afterStr = f.fmt ? f.fmt(valAfter) : String(valAfter);
      
      if (beforeStr !== afterStr) {
        diffs.push({
          label: f.name,
          before: beforeStr || '(vacío)',
          after: afterStr || '(vacío)'
        });
      }
    });
    
    let actionBadgeColor = '#d4a84b'; // edit
    if (log.tipoAccion === 'Creado') actionBadgeColor = '#22c55e';
    if (log.tipoAccion === 'Eliminado') actionBadgeColor = '#ef4444';
    if (log.tipoAccion === 'Restablecido') actionBadgeColor = '#10b981';
    
    html += '<div style="margin-bottom:16px; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px;">'+
      '<div style="font-weight:700; color:var(--gold); font-size:12.5px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">'+
        '<span>\u23F1\uFE0F Acción: <span style="color:'+actionBadgeColor+';">'+log.tipoAccion+'</span> el '+contFormatearFechaHora(log.fechaAccion)+'</span>'+
        '<span style="font-size:10px; color:var(--muted);">Registro '+(logs.length - idx)+'</span>'+
      '</div>';
      
    if (log.tipoAccion === 'Creado') {
      html += '<div style="font-size:12px; color:#ccc; line-height:1.4;">'+
        '<strong>Creado con:</strong><br>'+
        '💰 Monto: <span style="color:#22c55e; font-weight:700;">'+contFmt(parseFloat(stateAfter.monto || 0))+'</span><br>'+
        '🏷️ Categoría: '+stateAfter.categoria+'<br>'+
        '📝 Descripción: '+stateAfter.descripcion+'<br>'+
        '📅 Fecha: '+stateAfter.fecha+
      '</div>';
    } else if (log.tipoAccion === 'Eliminado') {
      html += '<div style="font-size:12px; color:#ccc; line-height:1.4;">'+
        '<strong>Eliminado con el estado:</strong><br>'+
        '💰 Monto: <span style="color:#ef4444; font-weight:700;">'+contFmt(parseFloat(stateBefore.monto || 0))+'</span><br>'+
        '🏷️ Categoría: '+stateBefore.categoria+'<br>'+
        '📝 Descripción: '+stateBefore.descripcion+'<br>'+
        '📅 Fecha: '+stateBefore.fecha+
      '</div>';
    } else if (log.tipoAccion === 'Restablecido') {
      html += '<div style="font-size:12px; color:#ccc; line-height:1.4;">'+
        '<strong>Restablecido a su estado activo:</strong><br>'+
        '💰 Monto: <span style="color:#10b981; font-weight:700;">'+contFmt(parseFloat(stateAfter.monto || 0))+'</span><br>'+
        '🏷️ Categoría: '+stateAfter.categoria+'<br>'+
        '📝 Descripción: '+stateAfter.descripcion+'<br>'+
        '📅 Fecha: '+stateAfter.fecha+
      '</div>';
    } else {
      if (diffs.length === 0) {
        html += '<div style="color:var(--muted); font-size:12px;">No se registraron cambios en los campos principales.</div>';
      } else {
        html += '<table style="width:100%; font-size:12px; border-collapse:collapse;">'+
          '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><th style="text-align:left; color:var(--muted); padding:6px 4px; font-weight:600;">Campo Modificado</th><th style="text-align:left; color:#f87171; padding:6px 4px; font-weight:600;">Antes</th><th style="text-align:left; color:#4ade80; padding:6px 4px; font-weight:600;">Después</th></tr></thead>'+
          '<tbody>'+
            diffs.map(d => '<tr style="border-bottom:1px solid rgba(255,255,255,0.02);"><td style="padding:6px 4px; font-weight:600; color:#ccc;">'+d.label+'</td><td style="padding:6px 4px; color:#f87171; text-decoration:line-through;">'+d.before+'</td><td style="padding:6px 4px; color:#4ade80;">'+d.after+'</td></tr>').join('')+
          '</tbody></table>';
      }
    }
    
    html += '</div>';
  });
  
  contentEl.innerHTML = html;
  document.getElementById('modalContHistorial').classList.add('open');
}

function contRenderMovimientos(el){
  const lista=contGetFiltrado();
  
  if (contSortOrder === 'ultimo') {
    const activeIds = new Set(lista.map(m => String(m.id)));
    const deletedMovementsMap = {};
    contAuditLog.forEach(log => {
      const logIdStr = String(log.movimientoId);
      if (log.tipoAccion === 'Eliminado' && !activeIds.has(logIdStr)) {
        if (!deletedMovementsMap[logIdStr] || new Date(log.fechaAccion) > new Date(deletedMovementsMap[logIdStr].fechaAccion)) {
          deletedMovementsMap[logIdStr] = log;
        }
      }
    });
    Object.values(deletedMovementsMap).forEach(log => {
      if (log.antes) {
        lista.push({
          ...log.antes,
          creadoEn: log.fechaAccion,
          isDeleted: true
        });
      }
    });
  }

  if (contSortOrder === 'fecha') {
    lista.sort(function(a,b){
      return new Date(b.fecha||0)-new Date(a.fecha||0);
    });
  } else if (contSortOrder === 'tipo') {
    lista.sort(function(a,b){
      const tComp = (a.tipo || '').localeCompare(b.tipo || '');
      if (tComp !== 0) return tComp;
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  } else if (contSortOrder === 'categoria') {
    lista.sort(function(a,b){
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  } else if (contSortOrder === 'mes') {
    lista.sort(function(a,b){
      return (parseInt(a.mes) || 0) - (parseInt(b.mes) || 0);
    });
  } else if (contSortOrder === 'ultimo') {
    lista.sort(function(a,b){
      const logsA = contAuditLog.filter(log => String(log.movimientoId) === String(a.id));
      const latestA = logsA.length > 0 ? logsA.reduce((max, log) => new Date(log.fechaAccion) > new Date(max.fechaAccion) ? log : max) : null;
      const timeA = latestA ? new Date(latestA.fechaAccion) : (a.creadoEn ? new Date(a.creadoEn) : new Date(a.fecha || 0));

      const logsB = contAuditLog.filter(log => String(log.movimientoId) === String(b.id));
      const latestB = logsB.length > 0 ? logsB.reduce((max, log) => new Date(log.fechaAccion) > new Date(max.fechaAccion) ? log : max) : null;
      const timeB = latestB ? new Date(latestB.fechaAccion) : (b.creadoEn ? new Date(b.creadoEn) : new Date(b.fecha || 0));

      return timeB - timeA;
    });
  }
  el.innerHTML=
  '<div class="cont-panel"><div class="cont-panel-header"><div class="cont-panel-title">\uD83D\uDCCB Todos los Movimientos</div>'+
  '<div style="display:flex;gap:10px;align-items:center;">'+
    '<span style="font-size:12px;color:var(--muted);white-space:nowrap;">Ordenar por:</span>'+
    '<select class="form-input" style="width:auto;height:32px;padding:0 8px;background:#18181b;border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:12px;border-radius:8px;cursor:pointer;" onchange="contCambiarOrden(this.value)">'+
      '<option value="fecha"'+(contSortOrder==='fecha'?' selected':'')+'>\uD83D\uDCC5 Fecha</option>'+
      '<option value="tipo"'+(contSortOrder==='tipo'?' selected':'')+'>\uD83D\uDD04 Tipo</option>'+
      '<option value="categoria"'+(contSortOrder==='categoria'?' selected':'')+'>\uD83C\uDFF7\uFE0F Categor\u00EDa</option>'+
      '<option value="mes"'+(contSortOrder==='mes'?' selected':'')+'>\uD83D\uDDD3\uFE0F Mes</option>'+
      '<option value="ultimo"'+(contSortOrder==='ultimo'?' selected':'')+'>\u23F1\uFE0F \u00DAltimo movimiento</option>'+
    '</select>'+
    '<button class="cont-btn-add" onclick="contAbrirModal(\'ingreso\')">\u2795 Ingreso</button><button class="cont-btn-add" onclick="contAbrirModal(\'egreso\')" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:#ef4444;">\u2795 Egreso</button>'+
  '</div></div>'+
  '<div class="cont-panel-body" style="padding:0;">'+
  (lista.length===0?'<div class="cont-empty" style="padding:40px;">Ninguno a\u00FAn.<br><br><button class="cont-btn-add" onclick="contAbrirModal()">\u2795 Primero</button></div>':
  '<table style="width:100%;border-collapse:collapse;font-size:13px;">'+
  '<thead><tr style="background:rgba(212,168,75,0.04);border-bottom:1px solid rgba(212,168,75,0.15);"><th style="padding:12px 16px;text-align:left;color:var(--gold);font-size:11px;text-transform:uppercase;">Fecha</th><th style="padding:12px 16px;text-align:left;color:var(--gold);font-size:11px;text-transform:uppercase;">Categor\u00EDa</th><th style="padding:12px 16px;text-align:left;color:var(--gold);font-size:11px;text-transform:uppercase;">Descripci\u00F3n</th><th style="padding:12px 16px;text-align:right;color:var(--gold);font-size:11px;text-transform:uppercase;">Monto</th><th style="padding:12px 16px;text-align:center;color:var(--gold);font-size:11px;text-transform:uppercase;">Tipo</th><th style="padding:12px 16px;text-align:center;color:var(--gold);font-size:11px;text-transform:uppercase;">Acc.</th></tr></thead>'+
  '<tbody>'+lista.map(function(m){
    const logs = contAuditLog.filter(log => String(log.movimientoId) === String(m.id));
    const hasHistory = logs.length > 0;
    const latestLog = hasHistory ? logs.reduce((max, log) => new Date(log.fechaAccion) > new Date(max.fechaAccion) ? log : max) : null;
    
    const dateDisplay = m.fecha || '—';
    const descDisplay = m.descripcion || '—';
    const rowStyle = m.isDeleted ? 'border-bottom:1px solid rgba(255,255,255,0.03); opacity:0.65; background:rgba(239,68,68,0.02);' : 'border-bottom:1px solid rgba(255,255,255,0.03);';
    const textStyle = m.isDeleted ? 'text-decoration:line-through; color:rgba(255,255,255,0.45);' : '';
    
    let timestampHtml = '';
    if (m.isDeleted) {
      timestampHtml = '<div style="font-size:9px;color:#ef4444;margin-top:2px;">❌ Eliminado el '+contFormatearFechaHora(m.creadoEn)+'</div>';
    } else {
      const displayTime = latestLog ? latestLog.fechaAccion : m.creadoEn;
      if (displayTime) {
        if (latestLog && latestLog.tipoAccion === 'Restablecido') {
          timestampHtml = '<div style="font-size:9px;color:#10b981;margin-top:2px;">♻️ Restablecido el '+contFormatearFechaHora(displayTime)+'</div>';
        } else {
          timestampHtml = '<div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px;">\u23F1\uFE0F '+contFormatearFechaHora(displayTime)+'</div>';
        }
      }
    }
    
    if (hasHistory) {
      timestampHtml += '<div onclick="event.stopPropagation(); contVerHistorial(\''+m.id+'\')" style="font-size:9px;color:var(--gold);margin-top:2.5px;cursor:pointer;text-decoration:underline;display:inline-block;">(Ver antes/después)</div>';
    }

    let actionBtnHtml = '';
    if (m.isDeleted) {
      actionBtnHtml = '<button onclick="contRestablecerMovimiento(\''+m.id+'\')" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:7px;color:#22c55e;padding:4px 8px;cursor:pointer;font-size:11px;" onmouseover="this.style.background=\'rgba(34,197,94,0.2)\'" onmouseout="this.style.background=\'rgba(34,197,94,0.1)\'">↩️ Restablecer</button>';
    } else if (m.isAuto) {
      actionBtnHtml = '<span style="color:#555;font-size:11px;">Auto</span>';
    } else {
      actionBtnHtml = '<button onclick="contEditarMovimiento(\''+m.id+'\')" style="background:none;border:1px solid rgba(255,255,255,0.1);border-radius:7px;color:#888;padding:4px 8px;cursor:pointer;font-size:11px;" onmouseover="this.style.borderColor=\'var(--gold)\';this.style.color=\'var(--gold)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.1)\';this.style.color=\'#888\'">\u270F\uFE0F</button>';
      if (latestLog && latestLog.tipoAccion === 'Restablecido') {
        actionBtnHtml += '<div style="font-size:9.5px;color:#10b981;margin-top:4px;font-weight:600;">♻️ Restablecido</div>';
      }
    }

    return '<tr style="'+rowStyle+'" onmouseover="this.style.background=\'rgba(255,255,255,0.025)\'" onmouseout="this.style.background=\'\'">'+
      '<td style="padding:10px 16px;color:#888;white-space:nowrap;line-height:1.2;'+textStyle+'">'+
        '<div style="font-weight:600;">'+dateDisplay+'</div>'+
        timestampHtml+
      '</td>'+
      '<td style="padding:10px 16px;color:#ccc;'+textStyle+'">'+(CONT_CAT_ICONS[m.categoria]||'\u2022')+' '+m.categoria+'</td>'+
      '<td style="padding:10px 16px;color:#fff;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'+textStyle+'">'+descDisplay+'</td>'+
      '<td style="padding:10px 16px;text-align:right;color:'+(m.isDeleted ? 'rgba(255,255,255,0.45)' : (m.tipo==='ingreso'?'#22c55e':'#ef4444'))+';font-weight:700;'+textStyle+'">'+(m.tipo==='ingreso'?'+':'-')+contFmt(parseFloat(m.monto||0))+'</td>'+
      '<td style="padding:10px 16px;text-align:center;">'+
        (m.isDeleted ? '<span style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);">❌ Eliminado</span>' :
        '<span style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;'+(m.tipo==='ingreso'?'background:rgba(34,197,94,0.12);color:#22c55e;border:1px solid rgba(34,197,94,0.25)':'background:rgba(239,68,68,0.10);color:#ef4444;border:1px solid rgba(239,68,68,0.2)')+';">'+(m.tipo==='ingreso'?'\uD83D\uDCB9 Ingreso':'\uD83D\uDD34 Egreso')+'</span>' +
        (latestLog && latestLog.tipoAccion === 'Restablecido' ? '<div style="margin-top:4px;"><span style="padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.25);">♻️ Restablecido</span></div>' : ''))+'</td>'+
      '<td style="padding:10px 16px;text-align:center;">'+actionBtnHtml+'</td>'+
    '</tr>';
  }).join('')+'</tbody></table>')+'</div></div>';
}

function contAbrirModal(tipoDefault, mesDefault, anoDefault){
  document.getElementById('contModalTitle').textContent='\u2795 Agregar Movimiento';
  document.getElementById('contMovId').value='';
  document.getElementById('contMovTipo').value=tipoDefault||'ingreso';
  document.getElementById('contMovCat').value=(tipoDefault==='egreso'?'N\u00F3mina/Personal':'Venta de Inmueble');
  document.getElementById('contMovDesc').value='';
  document.getElementById('contMovMonto').value='';
  
  const targetYear = anoDefault || contAnoFiltro || new Date().getFullYear();
  const targetMonth = mesDefault || contDetalleMesActivo || (new Date().getMonth() + 1);
  const todayStr = new Date().toISOString().split('T')[0];
  const targetMonthStr = String(targetMonth).padStart(2, '0');
  
  const today = new Date();
  if (today.getFullYear() === parseInt(targetYear) && (today.getMonth() + 1) === parseInt(targetMonth)) {
    document.getElementById('contMovFecha').value = todayStr;
  } else {
    document.getElementById('contMovFecha').value = `${targetYear}-${targetMonthStr}-01`;
  }
  
  document.getElementById('contMovMes').value = String(targetMonth);
  document.getElementById('contMovMesesActivo').value='1';
  document.getElementById('contMovMesesActivoDiv').style.display='';
  document.getElementById('contMovNotas').value='';
  document.getElementById('contMovBtnEliminar').style.display='none';
  contToggleTipo();
  document.getElementById('modalContabilidad').classList.add('open');
}

function contEditarMovimiento(id){
  const m=contMovimientos.find(function(x){return x.id===id;});if(!m)return;
  document.getElementById('contModalTitle').textContent='\u270F\uFE0F Editar Movimiento';
  document.getElementById('contMovId').value=m.id;
  document.getElementById('contMovTipo').value=m.tipo;
  document.getElementById('contMovCat').value=m.categoria;
  document.getElementById('contMovDesc').value=m.descripcion||'';
  document.getElementById('contMovMonto').value=m.monto;
  document.getElementById('contMovFecha').value=m.fecha||'';
  document.getElementById('contMovMes').value=String(m.mes||1);
  document.getElementById('contMovMesesActivo').value='1';
  document.getElementById('contMovMesesActivoDiv').style.display='';
  document.getElementById('contMovNotas').value=m.notas||'';
  document.getElementById('contMovBtnEliminar').style.display='inline-flex';
  contToggleTipo();
  document.getElementById('modalContabilidad').classList.add('open');
}

function contToggleTipo(){
  const tipo=document.getElementById('contMovTipo').value;
  const catSel=document.getElementById('contMovCat');
  const egresosCats=['N\u00F3mina/Personal','Arriendo Oficina','Marketing','Servicios P\u00FAblicos','Impuestos','Software/Tecnolog\u00EDa','Inversi\u00F3n','Aseo/Mantenimiento','Cafeter\u00EDa','Deudas','Transporte','Papeler\u00EDa','Otro Gasto'];
  const ingresosCats=['Venta de Inmueble','Arriendo','Aval\u00FAos','Remodelaci\u00F3n','Reparaci\u00F3n','Arquitectura','Gesti\u00F3n/Administraci\u00F3n','Consultor\u00EDa','Otro Servicio'];
  Array.from(catSel.options).forEach(function(opt){
    if(tipo==='egreso')opt.style.display=egresosCats.includes(opt.value)?'':'none';
    else opt.style.display=ingresosCats.includes(opt.value)?'':'none';
  });
  const vis=Array.from(catSel.options).find(function(o){return o.style.display!=='none';});
  if(vis&&!Array.from(catSel.options).find(function(o){return o.selected&&o.style.display!=='none';}))catSel.value=vis.value;
}

async function contSincronizarMovimientoDrive(obj) {
  if (!CONT_SCRIPT_URL) return;
  window.contSyncCount = (window.contSyncCount || 0) + 1;
  try {
    await fetch(CONT_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'saveMovimiento', movimiento: JSON.stringify(obj) })
    });
    console.log('Movimiento sincronizado en Drive exitosamente.');
    const idx = contMovimientos.findIndex(m => m.id === obj.id);
    if (idx >= 0) {
      delete contMovimientos[idx].isPending;
      contSave();
    }
  } catch (err) {
    console.error('Error al sincronizar movimiento en Drive:', err);
  } finally {
    window.contSyncCount = Math.max(0, (window.contSyncCount || 0) - 1);
  }
}


async function contEliminarMovimientoDrive(id) {
  if (!CONT_SCRIPT_URL) return;
  window.contSyncCount = (window.contSyncCount || 0) + 1;
  try {
    await fetch(CONT_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteMovimiento', id: id })
    });
    console.log('Movimiento eliminado de Drive exitosamente.');
  } catch (err) {
    console.error('Error al eliminar movimiento en Drive:', err);
  } finally {
    window.contSyncCount = Math.max(0, (window.contSyncCount || 0) - 1);
  }
}

async function contSincronizarMetasDrive(metasObj) {
  if (!CONT_SCRIPT_URL) return;
  try {
    await fetch(CONT_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'saveMetas', metas: JSON.stringify(metasObj) })
    });
    console.log('Metas sincronizadas en Drive exitosamente.');
  } catch (err) {
    console.error('Error al sincronizar metas en Drive:', err);
  }
}

function contGuardarMovimiento(){
  const id=document.getElementById('contMovId').value||('C'+Date.now());
  const tipo=document.getElementById('contMovTipo').value;
  const cat=document.getElementById('contMovCat').value;
  const desc=document.getElementById('contMovDesc').value.trim();
  const monto=parseFloat(document.getElementById('contMovMonto').value)||0;
  const fecha=document.getElementById('contMovFecha').value;
  const mes=parseInt(document.getElementById('contMovMes').value)||1;
  const notas=document.getElementById('contMovNotas').value.trim();
  if(!monto||monto<=0){toast('El monto debe ser mayor a 0','error');return;}
  if(!fecha){toast('Selecciona una fecha','error');return;}

  const mesesActivo = parseInt(document.getElementById('contMovMesesActivo').value) || 1;

  const movementsToAdd = [];
  const startTimestamp = Date.now();

  for (let i = 0; i < mesesActivo; i++) {
    let currentId = i === 0 ? id : ('C' + (startTimestamp + i));
    let tempFecha = new Date(fecha + 'T00:00:00');
    tempFecha.setMonth(tempFecha.getMonth() + i);
    let nextFechaStr = tempFecha.toISOString().split('T')[0];
    let nextMes = tempFecha.getMonth() + 1;
    let nextAno = tempFecha.getFullYear();

    const obj = {
      id: currentId,
      tipo: tipo,
      categoria: cat,
      descripcion: desc,
      monto: monto,
      fecha: nextFechaStr,
      mes: nextMes,
      ano: nextAno,
      notas: notas,
      creadoEn: new Date().toISOString(),
      isPending: !!CONT_SCRIPT_URL
    };
    movementsToAdd.push(obj);
  }

  movementsToAdd.forEach(function(obj) {
    const idx=contMovimientos.findIndex(function(m){return m.id===obj.id;});
    if(idx>=0) {
      const oldMov = contMovimientos[idx];
      contRegistrarAuditoria('Editado', oldMov, obj);
      contMovimientos[idx]=obj;
    } else {
      contRegistrarAuditoria('Creado', null, obj);
      contMovimientos.push(obj);
    }
  });
  
  contSave();
  closeModal('modalContabilidad');
  renderContabilidad();
  
  if (document.getElementById('modalContDetalleMes').classList.contains('open') && typeof contDetalleMesActivo !== 'undefined' && contDetalleMesActivo !== null) {
    contSeleccionarMesYVerMovimientos(contDetalleMesActivo);
  }
  
  if (mesesActivo > 1) {
    toast(mesesActivo + ' movimientos guardados \u2713', 'success');
  } else {
    toast('Movimiento guardado \u2713', 'success');
  }
  
  if (CONT_SCRIPT_URL) {
    (async function() {
      for (let i = 0; i < movementsToAdd.length; i++) {
        await contSincronizarMovimientoDrive(movementsToAdd[i]);
      }
      renderContabilidad();
      if (document.getElementById('modalContDetalleMes').classList.contains('open') && typeof contDetalleMesActivo !== 'undefined' && contDetalleMesActivo !== null) {
        contSeleccionarMesYVerMovimientos(contDetalleMesActivo);
      }
    })();
  }
}

function contEliminarMovimiento(){
  const id=document.getElementById('contMovId').value;if(!id)return;
  if(!confirm('\u00BFEliminar este movimiento?'))return;
  const oldMov = contMovimientos.find(function(m){return m.id===id;});
  if (oldMov) {
    contRegistrarAuditoria('Eliminado', oldMov, null);
  }
  contMovimientos=contMovimientos.filter(function(m){return m.id!==id;});
  
  contSave();
  closeModal('modalContabilidad');
  renderContabilidad();
  toast('Movimiento eliminado','success');
  
  if (document.getElementById('modalContDetalleMes').classList.contains('open') && typeof contDetalleMesActivo !== 'undefined' && contDetalleMesActivo !== null) {
    contSeleccionarMesYVerMovimientos(contDetalleMesActivo);
  }
  
  if (CONT_SCRIPT_URL) {
    contEliminarMovimientoDrive(id).then(() => {
      renderContabilidad();
      if (document.getElementById('modalContDetalleMes').classList.contains('open') && typeof contDetalleMesActivo !== 'undefined' && contDetalleMesActivo !== null) {
        contSeleccionarMesYVerMovimientos(contDetalleMesActivo);
      }
    });
  }
}

function contRestablecerMovimiento(id) {
  const logs = contAuditLog.filter(log => String(log.movimientoId) === String(id) && log.tipoAccion === 'Eliminado');
  if (logs.length === 0) {
    toast('No se encontró el registro de eliminación para este movimiento', 'error');
    return;
  }
  logs.sort((a, b) => new Date(b.fechaAccion) - new Date(a.fechaAccion));
  const deleteLog = logs[0];
  if (!deleteLog || !deleteLog.antes) {
    toast('No se encontró el estado anterior del movimiento', 'error');
    return;
  }
  
  if (!confirm('¿Desea restablecer este movimiento eliminado?')) return;
  
  const restoredMov = {
    ...deleteLog.antes,
    creadoEn: new Date().toISOString(),
    isPending: !!CONT_SCRIPT_URL
  };
  delete restoredMov.isDeleted;
  
  contMovimientos.push(restoredMov);
  
  contRegistrarAuditoria('Restablecido', null, restoredMov);
  
  contSave();
  renderContabilidad();
  toast('Movimiento restablecido ✓', 'success');
  
  if (CONT_SCRIPT_URL) {
    contSincronizarMovimientoDrive(restoredMov).then(() => {
      renderContabilidad();
    });
  }
}

function contAbrirMetas(){
  document.getElementById('metaIngMes').value=contMetas.ingMes||'';
  document.getElementById('metaIngAnual').value=contMetas.ingAnual||'';
  document.getElementById('metaGastoMes').value=contMetas.gastoMes||'';
  document.getElementById('modalContMeta').classList.add('open');
}


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

function contGuardarMetas(){
  contMetas.ingMes=parseFloat(document.getElementById('metaIngMes').value)||0;
  contMetas.ingAnual=parseFloat(document.getElementById('metaIngAnual').value)||0;
  contMetas.gastoMes=parseFloat(document.getElementById('metaGastoMes').value)||0;
  
  contSaveMetas();
  closeModal('modalContMeta');
  if(currentTab==='contabilidad')renderContabilidad();
  toast('Metas guardadas \u2713','success');
  
  if (CONT_SCRIPT_URL) {
    contSincronizarMetasDrive(contMetas).then(() => {
      if(currentTab==='contabilidad')renderContabilidad();
    });
  }
}
async function contPushTotal() {
  if (!CONT_SCRIPT_URL) { toast('No hay URL de contabilidad configurada', 'error'); return; }
  
  let localMovs = [];
  try {
    localMovs = JSON.parse(localStorage.getItem('icde_contabilidad') || '[]');
  } catch (e) {}
  
  // Filtrar los que no son automáticos
  const manualMovs = localMovs.filter(m => !m.isAuto);
  
  const btn = document.getElementById('btnContPush');
  if (btn) { btn.disabled = true; btn.textContent = 'Subiendo...'; }

  try {
    const payload = {
      action: 'importContabilidad',
      data: JSON.stringify({
        movimientos: manualMovs,
        metas: contMetas
      })
    };
    
    const res = await fetch(CONT_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok || res.type === 'opaque') {
      toast('Contabilidad sincronizada en Drive correctamente ✓', 'success');
      contMovimientos.forEach(m => { delete m.isPending; });
      contSave();
    } else {

      throw new Error('Error al sincronizar');
    }
  } catch (err) {
    console.error('Error en contPushTotal:', err);
    toast('Error al subir contabilidad a Drive', 'error');
  }

  if (btn) { btn.disabled = false; btn.textContent = '☁️ Subir contabilidad local a Drive'; }
  await contCargarDatos();
  renderContabilidad();
}

/* FIN MÓDULO CONTABILIDAD */
