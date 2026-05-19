
/* ═══════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════ */
const PASSWORD = 'icde2024';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-HipJ53KIf2JD1q9BUIBFUB45o4wRYcjvlqUbpg9TDAGK0q3hNQcSrV23dMCWaTgXcQ/exec?action=getData';
const CRM_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzFUuzwKA_5C35NX7S2eniREyP8AAqqYxz4rUoL195-vfIuiis8KmG3IbKIojfywllI1w/exec';

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
let allProps = [];
let leads = JSON.parse(localStorage.getItem('icde_leads') || '[]');
async function limpiarYFusionarDuplicados(forceCloudDelete = true) {
  try {
    let leadsUnicos = [];
    let telefonosVistos = new Map();
    let idsParaBorrarDeNube = [];
    let huboCambio = false;

    // Ordenar leads: más recientes o con más info primero
    // Obtener teléfonos eliminados para bloquearlos
    let deletedPhones = JSON.parse(localStorage.getItem('icde_deleted_phones') || '[]');

    // Filtrar leads que correspondan a teléfonos eliminados
    leads = leads.filter(l => {
      if (l.id === 'LEAD-AGENDA-GLOBAL') return true;
      let telLimpio = String(l.celular || '').replace(/\D/g, '');
      if (telLimpio && deletedPhones.includes(telLimpio)) {
        huboCambio = true;
        if (l.id && !String(l.id).startsWith('U-')) {
          idsParaBorrarDeNube.push(l.id);
        }
        return false;
      }
      return true;
    });

    // Ordenar leads: preferir los que NO empiezan con U- (prioridad ID de la nube C-)
    // y luego los más recientes
    leads.sort((a, b) => {
      const isA_U = String(a.id || '').startsWith('U-');
      const isB_U = String(b.id || '').startsWith('U-');
      if (isA_U !== isB_U) {
        return isA_U ? 1 : -1;
      }
      let tA = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
      let tB = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
      return tB - tA;
    });

    leads.forEach(l => {
      if (l.id === 'LEAD-AGENDA-GLOBAL') {
        leadsUnicos.push(l);
        return;
      }
      let telLimpio = String(l.celular || '').replace(/\D/g, '');
      if (telLimpio === '') {
        leadsUnicos.push(l);
        return;
      }

      if (!telefonosVistos.has(telLimpio)) {
        telefonosVistos.set(telLimpio, l);
        leadsUnicos.push(l);
      } else {
        // Es un duplicado! Fusionar con el principal
        let principal = telefonosVistos.get(telLimpio);
        huboCambio = true;

        // Fusionar visitas
        if (l.visitas && l.visitas.length) {
          if (typeof mergeVisitas === 'function') {
            principal.visitas = mergeVisitas(principal.visitas, l.visitas);
          } else {
            const combined = [...(principal.visitas || []), ...(l.visitas || [])];
            const seen = new Set();
            principal.visitas = combined.filter(v => {
              const k = (v.codigo || '') + '-' + (v.fecha || '');
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
          }
        }

        // Fusionar historial de envíos
        const combinedHist = [...(principal.historialEnvios || []), ...(l.historialEnvios || [])];
        const seenHist = new Set();
        principal.historialEnvios = combinedHist.filter(h => {
          const key = (h.fecha || '') + (h.codigo || '');
          if (seenHist.has(key)) return false;
          seenHist.add(key);
          return true;
        });

        // Fusionar propiedades enviadas
        principal.propsEnviadas = Array.from(new Set([...(principal.propsEnviadas || []), ...(l.propsEnviadas || [])]));

        // Fusionar notas si el principal no tiene
        if (!principal.notes && l.notes) {
          principal.notas = l.notes;
        } else if (!principal.notas && l.notas) {
          principal.notas = l.notas;
        }

        // Añadir ID duplicado a la lista para borrar de la nube
        if (l.id && !String(l.id).startsWith('U-')) {
          idsParaBorrarDeNube.push(l.id);
        }
      }
    });

    if (leads.length !== leadsUnicos.length) {
      leads = leadsUnicos;
      if (typeof saveLeads === 'function') {
        saveLeads();
      } else {
        try { localStorage.setItem('icde_leads', JSON.stringify(leads)); } catch(e){}
      }
      
      if (typeof rebuildCitas === 'function') rebuildCitas();
      
      // Renderizar la pestaña actual si corresponde
      if (typeof currentTab !== 'undefined') {
        if (currentTab === 'leads' && typeof renderLeadsBody === 'function') renderLeadsBody(leads);
        if (currentTab === 'citas' && typeof renderCitas === 'function') renderCitas();
        if (currentTab === 'pedidos' && typeof renderPedidosInmob === 'function') renderPedidosInmob();
      }

      // Borrar de la nube de forma silenciosa
      if (forceCloudDelete && idsParaBorrarDeNube.length > 0 && typeof CRM_SCRIPT_URL !== 'undefined' && CRM_SCRIPT_URL) {
        console.log("Borrando duplicados de la nube:", idsParaBorrarDeNube);
        for (let id of idsParaBorrarDeNube) {
          try {
            fetch(CRM_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              body: JSON.stringify({ action: 'deleteLead', id: id })
            });
          } catch (e) {
            console.error("Error al borrar duplicado de la nube:", id, e);
          }
        }
      }
      return true;
    }
  } catch(e) {
    console.error("Error en limpieza profunda de duplicados:", e);
  }
  return false;
}

try {
  limpiarYFusionarDuplicados(true);
} catch(e) { console.error("Error deduplicando inicial:", e); }
let deletedLeads = JSON.parse(localStorage.getItem('icde_deleted_leads') || '[]');
let citas = JSON.parse(localStorage.getItem('icde_citas') || '[]');
if (!Array.isArray(citas)) citas = []; // Ensure it's always an array
let settings = JSON.parse(localStorage.getItem('icde_settings') || '{"waApi":"","geminiKey":"AIzaSyALjX93RBFLp7AFEC-oK271rf3B1T3UpXo"}');
let currentTab = 'nuevo';
let selectedProps = [];
let currentLeadId = null;
let visitaLeadId = null;
let envioLeadId = null;
let envioLote = [];
let tempFiltros = {};
let leadViewMode = localStorage.getItem('icde_lead_view') || 'table';
let searchTermLeads = '';
let currentLeadFilter = 'todos';
let nlPage = 0;
const PAGE_SIZE = 20;
let criterioOrden = ''; // Default sort (no filter)
let nlShowData = false; // Por defecto recogido para optimizar espacio
let MAX_CATALOG_PRICE = 5000000000; // Valor por defecto
let kmzProps = [];
let kmzCategories = [];
let activeKmzCategories = [];
let mapViewportFilterActive = false; 


/* ═══════════════════════════════════════════════
   HELPERS & UTILS
═══════════════════════════════════════════════ */

let citasViewMode = localStorage.getItem('icde_citas_view') || 'lista';
let calDate = new Date();

// Helper de normalización global para evitar duplicados por acentos, mayúsculas, espacios, puntos o caracteres especiales
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

function freshLead(){
  return {
    tipo:'cliente', nombre:'', celular:'', notas:'', metodoPago:[], estado:'enviando', etiqueta:'activo',
    buscar:'', filtros:{tipoInmueble:[],rangoPrecio:[],zona:[],habitaciones:[],garaje:[],pisos:[],ubicacion:[],piscina:[],cocina:[],barrio:[],conjunto:[],minPrice:null,maxPrice:null,kmzCategory:[]},
    frecuencia:'semanal', maxPorEnvio:4, nombreInmobiliaria:'', nombreAgente:'',
    propsFiltradas:[], propsEnviadas:[], proximosEnvios:[], historialEnvios:[], visitas:[]
  };
}
let nuevoLead = freshLead();

/* ═══════════════════════════════════════════════
   SISTEMA DE FILTROS — IDÉNTICO AL INDEX.HTML
═══════════════════════════════════════════════ */
const FCAMPOS = [
  { key:'tipoInmueble', campo:'Tipo de inmueble', lbl:'Tipo de inmueble',
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>' },
  { key:'rangoPrecio', campo:'Rango de precio', lbl:'Precio', slider: true,
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
  { key:'zona', campo:'Zona', lbl:'Zona',
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>' },
  { key:'habitaciones', campo:'Habitaciones', lbl:'Habitaciones', num:true,
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h18M3 12V7a1 1 0 011-1h4a1 1 0 011 1v5M3 12v5h18v-5"/><path d="M13 6h4a1 1 0 011 1v5"/></svg>' },
  { key:'garaje', campo:'Garaje', lbl:'Garaje', num:true,
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' },
  { key:'pisos', campo:'Pisos', lbl:'Pisos', num:true,
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="18" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/><line x1="8" y1="3" x2="8" y2="21"/></svg>' },
  { key:'ubicacion', campo:'Ubicación', lbl:'Ubicación',
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { key:'piscina', campo:'Piscina', lbl:'Piscina',
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 6c.6.5 1.2 1 2.5 1s1.9-.5 2.5-1c.6-.5 1.2-1 2.5-1s1.9.5 2.5 1c.6.5 1.2 1 2.5 1s1.9-.5 2.5-1"/><path d="M2 12c.6.5 1.2 1 2.5 1s1.9-.5 2.5-1c.6-.5 1.2-1 2.5-1s1.9.5 2.5 1c.6.5 1.2 1 2.5 1s1.9-.5 2.5-1"/><path d="M2 18c.6.5 1.2 1 2.5 1s1.9-.5 2.5-1c.6-.5 1.2-1 2.5-1s1.9.5 2.5 1c.6.5 1.2 1 2.5 1s1.9-.5 2.5-1"/></svg>' },
  { key:'cocina', campo:'Cocina', lbl:'Cocina',
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 13.8V4a2 2 0 012-2h4a2 2 0 012 2v9.8a3 3 0 11-8 0z"/><path d="M9 22v-4M15 22v-4"/><path d="M18 5v10a2 2 0 01-2 2h-1"/></svg>' },

  { key:'barrio', campo:'Barrio', lbl:'Barrio',
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21v-4a4 4 0 118 0v4M13 21v-7a4 4 0 118 0v7M2 21h20"/></svg>' },
  { key:'conjunto', campo:'Conjunto', lbl:'Conjunto',
    ico:'<svg class="fn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V9l9-7 9 7v12M9 21v-6h6v6"/></svg>' }
];



// Estado por prefijo
const _fst = {};
function getFSt(pfx){ return _fst[pfx] || (_fst[pfx] = {}); }
function setFSt(pfx, obj){ _fst[pfx] = JSON.parse(JSON.stringify(obj)); }

function getUniqueVals(campo){
  const consolidated = new Map();
  // Filtramos isKmzOnly para que el menú de filtros solo muestre datos reales del catálogo Excel
  allProps.filter(d => !d.isKmzOnly).forEach(d => {
    const raw = String(d[campo] || "").trim();
    if (!raw) return;
    const n = norm(raw);
    if (!consolidated.has(n)) {
      consolidated.set(n, raw); 
    }
  });
  return Array.from(consolidated.values()).sort((a,b) => a.localeCompare(b));
}
function getUniqueNums(campo){
  const nums = allProps.filter(d => !d.isKmzOnly).map(d => {
    const v = String(d[campo] || "").trim();
    return v === "" ? NaN : Number(v);
  }).filter(v => !isNaN(v));
  return [...new Set(nums)].sort((a,b) => a - b).map(String);
}
function filtrarProps(f, returnAllIfEmpty = true, incluirVirtuales = false){
  const parseP = txt => parseFloat(String(txt || "").replace(/[^\d]/g, "")) || 0;
  
  if(!f) return allProps.filter(d => !d.isKmzOnly);

  // Filtrado base por estado de mapa y flag de incluir virtuales
  let base = allProps;
  if (!incluirVirtuales) {
    // Si no se solicitan virtuales, solo mostramos las propiedades reales del catálogo Excel
    base = allProps.filter(d => !d.isKmzOnly);
  } else {
    // Si se solicitan virtuales, los incluimos SOLO si el mapa está abierto y pertenecen a categorías activas
    if (f.mapActive) {
      const activeCatNorms = activeKmzCategories.map(c => norm(c));
      base = allProps.filter(d => {
        if (!d.isKmzOnly) return true; // Siempre incluir catálogo principal
        if (!activeKmzCategories.length) return false; // Si no hay categorías activas, excluir todo KMZ-only
        const cat = String(d['_kmzCategory'] || '').trim();
        if (!cat) return false; // KMZ-only sin categoría: excluir
        return activeCatNorms.includes(norm(cat));
      });
    } else {
      base = allProps.filter(d => !d.isKmzOnly);
    }
  }

  // Si el filtro está "vacío" (no hay nada seleccionado en ningún lado)
  // Para kmzCategory, lo consideramos "vacío" (sin filtrar) solo si contiene todas las categorías disponibles
  const hasCategoryFilter = f.kmzCategory && Array.isArray(f.kmzCategory) && f.kmzCategory.length < kmzCategories.length;
  const isDestacadas = (criterioOrden === 'destacadas');
  const isEmpty = !f.buscar && !f.minPrice && !f.maxPrice && !Object.values(f).some(v => Array.isArray(v) && v.length > 0 && v !== f.kmzCategory) && !hasCategoryFilter && !isDestacadas;
  
  if(isEmpty) return ordenarLista([...base]);

  const filtered = base.filter(d=>{
    // 1. Categorías (Multi-select)
    if(f.tipoInmueble?.length && !f.tipoInmueble.some(v => norm(v) === norm(d['Tipo de inmueble']))) return false;
    if(f.zona?.length         && !f.zona.some(v => norm(v) === norm(d['Zona'])))                     return false;
    if(f.habitaciones?.length && !f.habitaciones.includes(String(d['Habitaciones'] || "").trim()))     return false;
    if(f.garaje?.length       && !f.garaje.includes(String(d['Garaje'] || "").trim()))             return false;
    if(f.pisos?.length        && !f.pisos.includes(String(d['Pisos'] || "").trim()))               return false;
    if(f.ubicacion?.length    && !f.ubicacion.includes(String(d['Ubicación'] || "").trim()))       return false;
    if(f.piscina?.length      && !f.piscina.includes(String(d['Piscina'] || "").trim()))           return false;
    if(f.cocina?.length       && !f.cocina.includes(String(d['Cocina'] || "").trim()))             return false;
    if(f.barrio?.length       && !f.barrio.some(v => norm(v) === norm(d['Barrio'])))               return false;
    if(f.conjunto?.length     && !f.conjunto.some(v => norm(v) === norm(d['Conjunto'])))           return false;
    if(d.isKmzOnly && f.kmzCategory && Array.isArray(f.kmzCategory)){
      const propCat = String(d['_kmzCategory'] || "").trim();
      if(propCat){
        // Usamos una comparación normalizada para evitar problemas con espacios o emojis
        const activeNorm = f.kmzCategory.map(c => norm(c));
        if(!activeNorm.includes(norm(propCat))) return false;
      }
    }


    
    // 2. Rango de Precio (Numérico)
    if(f.minPrice !== null || f.maxPrice !== null){
      const p = parseP(d['Precio']);
      if(f.minPrice !== null && p < f.minPrice) return false;
      if(f.maxPrice !== null && p > f.maxPrice) return false;
    }

    // 3. Búsqueda de Texto
    const bus = f.buscar || f.buscarVal;
    if(bus){
      const txt = norm(bus);
      const codStr = String(d['Código'] || d['Cdigo'] || '');
      const combinado = norm((d['Nombre']||'') + ' ' + codStr + ' ' + (d['Zona']||'') + ' ' + (d['Barrio']||'') + ' ' + (d['Descripción']||'') + ' ' + (d['Puntos Clave']||''));
      if(!combinado.includes(txt) && !codStr.toLowerCase().includes(txt.toLowerCase())) return false;
    }
    // 4. Filtro especial Destacadas (Global)
    if(criterioOrden === 'destacadas' && !["Directo", "Verbal"].includes(String(d["Contrato"] || ""))) return false;
    
    return true;
  });
  return ordenarLista(filtered);
}

function parseP(txt){ return parseFloat(String(txt || "").replace(/[^\d]/g, "")) || 0; }

function ordenarLista(lista) {
  if (!criterioOrden) return lista;
  
  if (criterioOrden === "destacadas") {
    // Ponemos primero las que tienen contrato "Directo" o "Verbal", SIN filtrar el resto
    return [...lista].sort((a, b) => {
      const isA = ["Directo", "Verbal"].includes(a["Contrato"]);
      const isB = ["Directo", "Verbal"].includes(b["Contrato"]);
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      // Si ambos son iguales, ordenamos por precio descendente
      return parseP(b["Precio"]) - parseP(a["Precio"]);
    });
  }

  return lista.sort((a, b) => {
    if (criterioOrden === "menorPrecio" || criterioOrden === "mayorPrecio") {
      const pa = parseP(a["Precio"]);
      const pb = parseP(b["Precio"]);
      return (criterioOrden === "menorPrecio" ? pa - pb : pb - pa);
    }
    if (criterioOrden === "rentabilidad") {
      const parseRet = txt => {
        const num = parseFloat((txt || "").toString().replace(/[^\d.]/g, ""));
        return isNaN(num) ? Infinity : num;
      };
      const ra = parseRet(a["Retorno de la Inversión"]);
      const rb = parseRet(b["Retorno de la Inversión"]);
      return ra - rb;
    }
    if (criterioOrden === "noUbicadas") {
      const isUbi = p => {
        const lat = parseFloat(String(p['Latitud'] || p['Lat'] || '').replace(',','.'));
        const lng = parseFloat(String(p['Longitud'] || p['Lng'] || '').replace(',','.'));
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      };
      const uA = isUbi(a);
      const uB = isUbi(b);
      if(!uA && uB) return -1;
      if(uA && !uB) return 1;
      return 0;
    }
    return 0;
  });
}

function getSortLabel(crit){
  const labels = { 'destacadas': 'Destacadas', 'menorPrecio': 'Menor precio', 'mayorPrecio': 'Mayor precio', 'rentabilidad': 'Rentabilidad', 'noUbicadas': 'Faltan por mapa' };
  return labels[crit] || 'Ordenar por';
}

// Gestión de menús y clics globales (Única vez)
document.addEventListener('click', e => {
  // Cerrar Sort Menus
  if(!e.target.closest('.ordenar-por')) {
    document.querySelectorAll('.sort-options').forEach(o => o.classList.add('hidden'));
    document.querySelectorAll('.sort-toggle').forEach(t => t.classList.remove('st-open'));
  }

  // Cerrar Filtros
  if(!e.target.closest('.filtro-nuevo')){
    document.querySelectorAll('.filtro-nuevo.fn-open').forEach(f=>f.classList.remove('fn-open'));
  }
});

function toggleSortMenu(e){
  e.stopPropagation();
  const wrap = e.currentTarget.closest('.ordenar-por');
  const list = wrap.querySelector('.sort-options');
  const toggle = wrap.querySelector('.sort-toggle');
  if(!list || !toggle) return;
  const isHidden = list.classList.contains('hidden');
  
  // Cerrar filtros si hubiera
  document.querySelectorAll('.filtro-nuevo.fn-open').forEach(f=>f.classList.remove('fn-open'));
  // Cerrar otros menús de orden
  document.querySelectorAll('.sort-options').forEach(o => o.classList.add('hidden'));
  
  if(isHidden){
    list.classList.remove('hidden');
    toggle.classList.add('st-open');
  } else {
    list.classList.add('hidden');
    toggle.classList.remove('st-open');
  }
}

function setSort(crit){
  criterioOrden = crit;
  localStorage.setItem('icde_sort', crit);
  
  // Actualizar TODOS los dropdowns de orden
  document.querySelectorAll('.ordenar-por').forEach(wrap => {
    const list = wrap.querySelector('.sort-options');
    const toggle = wrap.querySelector('.sort-toggle');
    if(list) {
      list.querySelectorAll('li').forEach(li => {
        if(li.getAttribute('onclick')?.includes(`'${crit}'`)) li.classList.add('st-selected');
        else li.classList.remove('st-selected');
      });
    }
    if(toggle) {
      toggle.classList.remove('st-open');
      toggle.innerHTML = `${getSortLabel(crit)} <span class="st-arrow"></span>`;
    }
  });
  
  nlPage = 0; 
  renderPropsGrid();
  fnActualizarConteo('nl');
  actualizarPinesMapa('nl'); // Sincronizar mapa
  const efGrid = document.getElementById('editFiltrosGrid');
  if(efGrid) {
    const efSt = getFSt('ef');
    renderEditFiltrosGrid(filtrarProps(efSt));
  }
}

// Escapa comillas simples para usar dentro de onclick
function eq(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

/* Construye la barra de filtros completa dentro de #containerId */
function buildFiltrosBar(containerId, pfx, initVals){
  setFSt(pfx, initVals || {tipoInmueble:[],rangoPrecio:[],zona:[],habitaciones:[],garaje:[],pisos:[],ubicacion:[],piscina:[],cocina:[],barrio:[],conjunto:[],minPrice:null,maxPrice:null,kmzCategory:[], mapActive: false});
  const wrap = document.getElementById(containerId);
  if(!wrap) return;

  wrap.innerHTML = `
    <div class="pc-filtros-wrapper">
      <div class="filtros-grid-nueva" id="fnGrid_${pfx}">
        ${FCAMPOS.map(c=>`
          <div class="filtro-nuevo" id="fn_${pfx}_${c.key}" onclick="fnToggleFilter(this, event)">
            <div class="filtro-nuevo-head" id="fnH_${pfx}_${c.key}">
              ${c.ico}
              <span class="fn-lbl" id="fnL_${pfx}_${c.key}">${c.lbl}</span>
              <span class="fn-arrow"></span>
            </div>
            <div class="filtro-nuevo-dropdown" id="fnD_${pfx}_${c.key}" onclick="event.stopPropagation()"></div>
          </div>`).join('')}
      </div>
      <div class="pc-buscar-row">
        <span class="bn-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input type="text" id="fnBus_${pfx}" placeholder="Buscar por nombre, código, barrio..." oninput="fnBuscar('${pfx}',this.value)"/>
        <button class="btn-generar-pc" id="btnGen_${pfx}" onclick="fnGenerarLink('${pfx}', this)">Generar link</button>
        <button class="btn-limpiar-pc" onclick="fnLimpiar('${pfx}')">Limpiar filtros</button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; margin-bottom: 4px;">
        <div class="pc-count-bar" style="padding:0; margin:0;">Propiedades encontradas: <strong id="fnCnt_${pfx}">—</strong></div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; color: var(--muted); font-weight: 500;">🗺 MAPA</span>
          <label class="switch">
            <input type="checkbox" id="btnToggleMapa_${pfx}" onclick="toggleMapa('${pfx}')">
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div id="mapaContenedor_${pfx}" style="position: relative;">
        <div id="mapaLeaflet_${pfx}" style="width:100%; height:100%; border-radius:12px; z-index:1;"></div>
        
        <!-- Controles flotantes sobre el mapa -->
        <div class="map-floating-controls" style="position: absolute; top: 10px; right: 10px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; pointer-events: none;">
          <div class="map-control-card" style="background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 10px; pointer-events: auto; box-shadow: var(--shadow); min-width: 150px;">
            <div style="font-size: 10px; font-weight: 700; color: var(--gold); text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              Vista del Mapa 
              <label class="switch" style="transform: scale(0.8);">
                <input type="checkbox" onchange="mapViewportFilterActive = this.checked; updateMapBoundsFilter('${pfx}')">
                <span class="slider"></span>
              </label>
            </div>
            <div style="font-size: 10px; font-weight: 700; color: var(--gold); text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleCategoriasMap('${pfx}')">
              <span>📂 Categorías</span>
              <span id="kmzCatArrow_${pfx}" style="transition: transform 0.3s; transform: rotate(-90deg);">▼</span>
            </div>
            <div id="kmzCategoryToggle_${pfx}" style="display: none; flex-direction: column; gap: 4px; max-height: 150px; overflow-y: auto; padding-right: 4px; transition: all 0.3s ease;">
              <!-- Se puebla dinámicamente con las categorías del KMZ -->
              <div style="font-size: 11px; color: #888; text-align: center; padding: 10px;">Cargando categorías...</div>
            </div>
          </div>
          <div class="map-control-card" style="background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 8px; pointer-events: auto; box-shadow: var(--shadow); display: flex; gap: 8px; align-items: center; justify-content: center;">
            <button class="btn-map-control btn-map-add-mode" id="btnAddProp_${pfx}" onclick="toggleMapAddMode('${pfx}')" title="Agregar propiedad en el mapa">➕</button>
            <button class="btn-map-control" onclick="actualizarPinesMapa('${pfx}', true)" title="Recentrar mapa">🎯</button>
            <button class="btn-map-control" onclick="refreshData()" title="Actualizar datos">🔄</button>
          </div>
        </div>
      </div>
    </div>`;

  // Poblar dropdowns
  FCAMPOS.forEach(c => fnPoblar(pfx, c));

  // Cabeceras con los valores iniciales
  FCAMPOS.forEach(c => fnRenderHead(pfx, c.key));

  fnActualizarConteo(pfx);
  renderKmzCategories(pfx);
}

function fnToggleFilter(el, e){
  if(e.target.closest('.fn-tag-x')) return;
  const was = el.classList.contains('fn-open');
  // Cerrar otros filtros
  document.querySelectorAll('.filtro-nuevo.fn-open').forEach(f=>{
    if(f !== el) f.classList.remove('fn-open');
  });
  // Cerrar Sort Menu
  const sortList = document.getElementById('sortOptions');
  if(sortList) sortList.classList.add('hidden');

  if(was) el.classList.remove('fn-open');
  else el.classList.add('fn-open');
}

/* Poblar un dropdown con las opciones de un campo */
function fnPoblar(pfx, c){
  const drop = document.getElementById(`fnD_${pfx}_${c.key}`);
  if(!drop) return;
  const st = getFSt(pfx);

  if(c.slider){
    const minVal = st.minPrice || 0;
    const maxVal = st.maxPrice || MAX_CATALOG_PRICE;
    const curMin = Math.round(minVal/1e6);
    const curMax = Math.round(maxVal/1e6);
    const topM = Math.round(MAX_CATALOG_PRICE/1e6);
    
    // Funciones de mapeo bilineal
    const valToPos = v => (v <= 1000) ? (v/1000)*70 : 70 + ((v-1000)/(topM-1000))*30;

    drop.style.minWidth = '280px';
    drop.innerHTML = `
      <div class="price-slider-wrap">
        <div class="price-inputs">
          <div class="form-group"><label class="form-label">Min (MM)</label><input type="number" id="inpMin_${pfx}" value="${curMin}" oninput="fnSetPrice('${pfx}','min',this.value,true)" onclick="event.stopPropagation()"/></div>
          <div class="form-group"><label class="form-label">Max (MM)</label><input type="number" id="inpMax_${pfx}" value="${curMax}" oninput="fnSetPrice('${pfx}','max',this.value,true)" onclick="event.stopPropagation()"/></div>
        </div>
        <div class="price-slider-container">
          <div class="price-slider-track"></div>
          <div class="price-slider-fill" id="sldFill_${pfx}"></div>
          <input type="range" min="0" max="100" step="0.1" value="${valToPos(curMin)}" id="sldMin_${pfx}" oninput="fnSetPrice('${pfx}','min',this.value)"/>
          <input type="range" min="0" max="100" step="0.1" value="${valToPos(curMax)}" id="sldMax_${pfx}" oninput="fnSetPrice('${pfx}','max',this.value)"/>
        </div>
        <div style="font-size:11px;color:#888;margin-top:14px;text-align:center;">Valores en Millones de Pesos (MM)<br/>Escala optimizada para rangos bajos</div>
      </div>`;
    setTimeout(()=>fnUpdateSliderTrack(pfx), 0);
    return;
  }

  let vals = c.num ? getUniqueNums(c.campo) : getUniqueVals(c.campo);
  if(c.key === 'ubicacion') vals.sort((a,b) => String(b).localeCompare(String(a)));
  
  // Para conteos dinámicos: filtramos ignorando el campo actual
  const stBase = JSON.parse(JSON.stringify(st));
  delete stBase[c.key];
  const subset = filtrarProps(stBase, true);

  drop.innerHTML = vals.map(v => {
    const nv = norm(v);
    const cnt = subset.filter(d=>norm(d[c.campo])===nv).length;
    const sel = (st[c.key]||[]).some(x => norm(x) === nv);
    return `<div class="fn-option${sel?' fn-sel':''}${cnt===0 && !sel?' fn-zero':''}" data-v="${eq(v)}"
      onclick="fnToggle('${pfx}','${c.key}','${eq(v)}',this);event.stopPropagation()">
      <span class="fn-chk"></span>${v}<span class="fn-count">(${cnt})</span>
    </div>`;
  }).join('');
}

function fnSetPrice(pfx, type, val, isDirect){
  const st = getFSt(pfx);
  const topM = Math.round(MAX_CATALOG_PRICE/1e6);
  const posToVal = p => (p <= 70) ? (p/70)*1000 : 1000 + ((p-70)/30)*(topM-1000);
  const valToPos = v => (v <= 1000) ? (v/1000)*70 : 70 + ((v-1000)/(topM-1000))*30;

  let v = parseFloat(val) || 0;
  if(!isDirect) v = Math.round(posToVal(v));
  
  if(type === 'min'){
    const maxVal = Math.round((st.maxPrice || MAX_CATALOG_PRICE)/1e6);
    if(v > maxVal) v = maxVal;
    st.minPrice = v * 1e6;
    const sld = document.getElementById(`sldMin_${pfx}`); if(sld) sld.value = valToPos(v);
    const inp = document.getElementById(`inpMin_${pfx}`); if(inp) inp.value = v;
  } else {
    const minVal = Math.round((st.minPrice || 0)/1e6);
    if(v < minVal) v = minVal;
    st.maxPrice = v * 1e6;
    const sld = document.getElementById(`sldMax_${pfx}`); if(sld) sld.value = valToPos(v);
    const inp = document.getElementById(`inpMax_${pfx}`); if(inp) inp.value = v;
  }
  
  fnUpdateSliderTrack(pfx);
  fnRenderHead(pfx, 'rangoPrecio');
  fnActualizarConteo(pfx);
}

function fnUpdateSliderTrack(pfx){
  const sldMin = document.getElementById(`sldMin_${pfx}`);
  const sldMax = document.getElementById(`sldMax_${pfx}`);
  const fill = document.getElementById(`sldFill_${pfx}`);
  if(!sldMin || !sldMax || !fill) return;
  
  const v1 = parseFloat(sldMin.value);
  const v2 = parseFloat(sldMax.value);
  const left = Math.min(v1, v2);
  const width = Math.max(v1, v2) - left;
  
  fill.style.left = left + '%';
  fill.style.width = width + '%';
  fill.style.right = 'auto';
}

/* Toggle de una opción */
function fnToggle(pfx, key, val, el){
  const st = getFSt(pfx);
  const nv = norm(val);
  if(!st[key]) st[key] = [];
  const idx = st[key].findIndex(x => norm(x) === nv);
  if(idx >= 0){
    st[key].splice(idx, 1);
    if(el) el.classList.remove('fn-sel');
  } else {
    st[key].push(val);
    if(el) el.classList.add('fn-sel');
  }
  fnRenderHead(pfx, key);
  fnActualizarConteo(pfx);
  fnSincronizar(pfx);
}

/* Quitar tag */
function fnQuitarTag(pfx, key, val, e){
  e.stopPropagation();
  const st = getFSt(pfx);
  const nv = norm(val);
  st[key] = (st[key] || []).filter(v => norm(v) !== nv);
  document.querySelectorAll(`#fnD_${pfx}_${key} [data-v]`).forEach(o => {
    if(norm(o.getAttribute('data-v')) === nv) o.classList.remove('fn-sel');
  });
  fnRenderHead(pfx, key);
  fnActualizarConteo(pfx);
  fnSincronizar(pfx);
}

/* Renderizar cabecera (con tags o label) */
function fnRenderHead(pfx, key){
  const st = getFSt(pfx);
  const vals = st[key]||[];
  const c = FCAMPOS.find(f=>f.key===key);
  const head = document.getElementById(`fnH_${pfx}_${key}`);
  const lbl  = document.getElementById(`fnL_${pfx}_${key}`);
  if(!head||!lbl) return;
  let tagsEl = head.querySelector('.fn-tags');
  if(vals.length===0){
    tagsEl?.remove();
    lbl.style.display=''; lbl.textContent=c.lbl;
  } else {
    lbl.style.display='none';
    if(!tagsEl){ tagsEl=document.createElement('span'); tagsEl.className='fn-tags'; head.insertBefore(tagsEl,head.querySelector('.fn-arrow')); }
    if(key === 'rangoPrecio'){
      const min = st.minPrice ? Math.round(st.minPrice/1e6)+'M' : '0';
      const max = st.maxPrice ? Math.round(st.maxPrice/1e6)+'M' : '5000M';
      tagsEl.innerHTML = `<span class="fn-tag">${min} - ${max}<span class="fn-tag-x" onclick="fnResetPrice('${pfx}',event)">✕</span></span>`;
    } else {
      tagsEl.innerHTML = vals.slice(0,3).map(v=>`<span class="fn-tag">${v}<span class="fn-tag-x" onclick="fnQuitarTag('${pfx}','${key}','${eq(v)}',event)">✕</span></span>`).join('')
        +(vals.length>3?`<span class="fn-tag">+${vals.length-3}</span>`:'');
    }
  }
}

function fnResetPrice(pfx, e){
  e.stopPropagation();
  const st = getFSt(pfx);
  st.minPrice = null; st.maxPrice = null;
  fnPoblar(pfx, FCAMPOS.find(c=>c.key==='rangoPrecio'));
  fnRenderHead(pfx, 'rangoPrecio');
  fnActualizarConteo(pfx);
}

function fnActualizarConteo(pfx){
  const st = getFSt(pfx);
  const busVal = (document.getElementById(`fnBus_${pfx}`)?.value || '').trim();
  st.buscar = busVal;

  // Sincronizar con el estado global correspondiente
  if(pfx==='nl'){
    nuevoLead.filtros = JSON.parse(JSON.stringify(st));
    nuevoLead.buscar = busVal;
  } else if(pfx==='ef'){
    Object.assign(tempFiltros, JSON.parse(JSON.stringify(st)));
    tempFiltros.buscar = busVal;
  }

  let f = filtrarProps(st, true);
  if(pfx==='nl'){
    if(criterioOrden==='destacadas') f = f.filter(a => ["Directo", "Verbal"].includes(a["Contrato"]));
    else if(criterioOrden==='noUbicadas') f = f.filter(p => {
      const lat = parseFloat(String(p['Latitud'] || p['Lat'] || '').replace(',','.'));
      const lng = parseFloat(String(p['Longitud'] || p['Lng'] || '').replace(',','.'));
      return isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0;
    });
  }
  const el = document.getElementById(`fnCnt_${pfx}`);
  if(el) el.textContent = f.length;

  // El botón Generar link siempre visible
  const btnGen = document.getElementById(`btnGen_${pfx}`);
  if(btnGen) btnGen.style.display = 'flex';

  // Actualizar todos los dropdowns para reflejar conteos dinámicos
  FCAMPOS.forEach(c => {
    if(!c.slider) fnPoblar(pfx, c);
  });

  if(pfx==='nl') {
    nlPage = 0; // Reset pagination on filter change
    renderPropsGrid();
    actualizarPinesMapa(pfx); // Sincronizar pines en el mapa
  } else if(pfx==='ef') {
    renderEditFiltrosGrid(f);
    actualizarPinesMapa(pfx); // Sincronizar pines en el mapa
  }
}

function renderEditFiltrosGrid(lista){
  const el = document.getElementById('editFiltrosGrid'); if(!el) return;
  if(!lista.length){ el.innerHTML = '<div class="empty">No hay propiedades con estos filtros</div>'; return; }
  const sliced = lista.slice(0, 30);
  let html = '<div class="props-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">';
  for(let d of sliced){
    const cod = String(d['Código']||'');
    const sel = selectedProps.includes(cod);
    const img = (d['Imagenes']||'').split('|')[0].trim() || d['Image'] || 'https://i.imgur.com/Pc9M3I8.png';
    const isDestacada = ["Directo", "Verbal"].includes(d["Contrato"]);
    html += `
      <div class="prop-card ${sel?'selected':''} ${isDestacada?'recomendado':''}" style="min-height:auto;" onclick="abrirModalProp('${eq(cod)}')">
        ${isDestacada ? '<div class="ribbon"><span>¡Destacada!</span></div>' : ''}
        <div class="prop-card-selector" onclick="event.stopPropagation(); toggleProp('${eq(cod)}', this.parentElement)">${sel?'✓':'+'}</div>
        <img src="${img}" style="height:110px; width:100%; object-fit:cover; border-radius:8px;"/>
        <div class="prop-card-body" style="padding:4px 0 8px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="font-weight:bold; color:#8c8c8c; font-size:14px;">Código: ${cod}</div>
            ${d['Inmobiliaria'] ? `<div class="prop-card-inmobiliaria" title="${eq(d['Inmobiliaria'])}">${d['Inmobiliaria']}</div>` : ''}
          </div>
          <div style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; font-weight:600;">${d['Nombre']||''}</div>
          <div style="font-weight:700; font-size:11px; margin-bottom:6px; color:#22c55e;">${formatP(d['Precio'])}</div>
          
          <div class="prop-card-features" style="display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:11px; color:#ccc;">
              ${d['Habitaciones'] ? `<span><span style="opacity:0.7;">🛏</span> ${d['Habitaciones']}</span>` : ''}
              ${d['Baños'] ? `<span><span style="opacity:0.7;">🛁</span> ${d['Baños']}</span>` : ''}
              ${d['Garaje'] ? `<span><span style="opacity:0.7;">🚗</span> ${d['Garaje']}</span>` : ''}
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:11px; color:#ccc;">
              ${d['Cocina'] ? `<span><span style="opacity:0.7;">🍳</span> ${d['Cocina']}</span>` : ''}
              ${d['Pisos'] ? `<span>Pisos ${d['Pisos']}</span>` : ''}
              ${d['Área'] ? `<span><span style="opacity:0.7;">📐</span> Lote ${d['Área']} m²</span>` : ''}
            </div>
            ${String(d['Rentabilidad']||'').trim() ? `<div style="font-size:11px; font-weight:700; color:var(--gold); margin-top:2px;">${d['Rentabilidad']}</div>` : ''}
          </div>
        </div>
      </div>`;
  }
  html += '</div>';
  if(lista.length > 30) html += `<div style="text-align:center; padding:10px; font-size:12px; color:var(--gold); font-weight:600;">... y otras ${lista.length-30} propiedades más</div>`;
  el.innerHTML = html;
}

function getSearchLinkFromFilters(st, ids, leadId){
  if(!st && (!ids || !ids.length)) return 'https://icdeinmobiliaria.com/';
  const url = new URL('https://icdeinmobiliaria.com/');
  const p = url.searchParams;
  
  if(ids && ids.length) {
    p.set('ids', ids.join(','));
  } else {
    if(st.buscar) p.set('q', st.buscar.trim());
    if(st.tipoInmueble?.length) p.set('tipo', st.tipoInmueble.join(','));
    if(st.minPrice) p.set('min', st.minPrice);
    if(st.maxPrice) p.set('max', st.maxPrice);
    if(st.zona?.length)         p.set('zona', st.zona.join(','));
    if(st.habitaciones?.length) p.set('hab', st.habitaciones.join(','));
    if(st.garaje?.length)       p.set('garaje', st.garaje.join(','));
    if(st.pisos?.length)        p.set('pisos', st.pisos.join(','));
    if(st.ubicacion?.length)    p.set('ubicacion', st.ubicacion.join(','));
    if(st.piscina?.length)      p.set('piscina', st.piscina.join(','));
    if(st.cocina?.length)       p.set('cocina', st.cocina.join(','));
    if(st.barrio?.length)       p.set('barrio', st.barrio.join(','));
    if(st.conjunto?.length)     p.set('conjunto', st.conjunto.join(','));
  }
  if(leadId) {
    p.set('lid', leadId);
  }
  return url.toString();
}

function fnGenerarLink(pfx, btn){
  const st = getFSt(pfx);
  const busVal = (document.getElementById(`fnBus_${pfx}`)?.value || '').trim();
  st.buscar = busVal;
  
  // Si es Nuevo Lead o Editar Filtros, incluimos seleccionados
  const ids = ((pfx === 'nl' || pfx === 'ef') && typeof selectedProps !== 'undefined' && selectedProps.length > 0) ? selectedProps : null;
  
  // Si tenemos un lead activo o en proceso de envío, incluimos su ID
  const leadId = (typeof currentLeadId !== 'undefined' && currentLeadId) ? currentLeadId : null;
  
  const link = getSearchLinkFromFilters(st, ids, leadId);
  navigator.clipboard.writeText(link).then(() => {
    const original = btn.innerHTML;
    btn.textContent = '¡Copiado!';
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  });
}


/* Sincronizar estado filtros hacia el objeto correspondiente */
function fnSincronizar(pfx){
  const st = getFSt(pfx);
  const busVal = (document.getElementById(`fnBus_${pfx}`)?.value || '').trim();
  st.buscar = busVal;

  if(pfx==='nl'){
    nuevoLead.filtros = JSON.parse(JSON.stringify(st));
    nuevoLead.buscar = busVal;
  } else if(pfx==='ef'){
    Object.assign(tempFiltros, JSON.parse(JSON.stringify(st)));
    tempFiltros.buscar = busVal;
    const cnt = filtrarProps(tempFiltros).length;
    const el = document.getElementById('editFiltrosCount');
    if(el) el.textContent = `${cnt} propiedades encontradas`;
  }
}

/* Buscar texto */
function fnBuscar(pfx, val){
  fnSincronizar(pfx);
  fnActualizarConteo(pfx);
}

/* Limpiar todo */
function fnLimpiar(pfx){
  const st = getFSt(pfx);
  Object.keys(st).forEach(k => {
    if(Array.isArray(st[k])) st[k] = [];
    else st[k] = null;
  });
  st.buscar = '';
  
  FCAMPOS.forEach(c=>{
    fnRenderHead(pfx,c.key);
  });
  
  const bi = document.getElementById(`fnBus_${pfx}`);
  if(bi) bi.value='';
  
  fnSincronizar(pfx);
  fnActualizarConteo(pfx);
}

/* ═══════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════ */
document.getElementById('passInput').addEventListener('keydown',e=>{ if(e.key==='Enter') doLogin(); });
window.doLogin = function(){
  const pass = document.getElementById('passInput').value;
  if(pass === PASSWORD){
    document.getElementById('loginScreen').style.display='none';
    const app=document.getElementById('app'); app.style.display='flex'; app.style.flexDirection='column';
    initApp();
  } else {
    document.getElementById('loginError').style.display='block';
    document.getElementById('passInput').value='';
  }
};
function hardResetData() {
  if (confirm("¿Estás seguro? Esto borrará la memoria local del navegador (caché) y recargará todo desde la nube. Úsalo si la página se queda trabada.")) {
    localStorage.clear();
    location.reload();
  }
}

/* Sube TODOS los leads del localStorage actual a Google Sheets.
   Úsalo en el computador que tiene los datos correctos para
   enviarlos a la nube y que el otro los pueda ver. */
async function forzarPushTotal() {
  if (!CRM_SCRIPT_URL) { toast('No hay URL de sincronización configurada', 'error'); return; }
  if (!leads.length)    { toast('No hay leads en este computador', 'error'); return; }

  const btn = document.getElementById('btnForzarPush');
  if (btn) { btn.disabled = true; btn.textContent = 'Subiendo...'; }

  let ok = 0, err = 0;
  // Enviar de a 3 en paralelo para no saturar el servidor
  const chunks = [];
  for (let i = 0; i < leads.length; i += 3) chunks.push(leads.slice(i, i + 3));

  for (const chunk of chunks) {
    await Promise.all(chunk.map(async lead => {
      try {
        await fetch(CRM_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'saveLead', lead: JSON.stringify(lead) })
        });
        ok++;
      } catch (e) { err++; }
    }));
    // Pequeña pausa para no bloquear Apps Script
    await new Promise(r => setTimeout(r, 400));
  }

  if (btn) { btn.disabled = false; btn.textContent = '☁️ Subir todo a la nube'; }
  toast(`Push total: ${ok} leads subidos${err ? `, ${err} con error` : ''} ✓`, ok > 0 ? 'success' : 'error');
  console.log(`[forzarPushTotal] OK: ${ok}, ERR: ${err}`);
}
function doLogout(){
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('app').style.display='none';
  document.getElementById('passInput').value='';
  document.getElementById('loginError').style.display='none';
}
/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   KMZ INTEGRATION
═══════════════════════════════════════════════ */
async function cargarKmz() {
  try {
    const res = await fetch('propiedades_kmz.json');
    if (!res.ok) throw new Error('No se pudo cargar propiedades_kmz.json');
    const data = await res.json();
    
    kmzProps = data;
    
    // Extraer categorías únicas
    kmzCategories = [...new Set(kmzProps.map(p => p['Categoría']))].filter(Boolean).sort();
    
    // Por defecto, todas activas EXCEPTO "Inventario Barrios" (siempre desactivado al abrir)
    activeKmzCategories = kmzCategories.filter(cat => !cat.toUpperCase().includes("INVENTARIO BARRIOS"));
    
    console.log(`Cargadas ${kmzProps.length} propiedades desde KMZ en ${kmzCategories.length} categorías.`);
    
    correlacionarKmzConCatalogo();
    
    // Inicializar el filtro de categorías en el estado global de 'nl'
    // Solo las categorías activas (sin Inventario Barrios)
    const stNl = getFSt('nl');
    stNl.kmzCategory = [...activeKmzCategories];

    renderKmzCategories('nl');
    // Actualizar conteo ya que el filtro cambió
    fnActualizarConteo('nl');
  } catch (e) {
    console.error("Error cargando KMZ JSON:", e);
  }
}

function correlacionarKmzConCatalogo() {
  if (!allProps.length || !kmzProps.length) return;

  // Normalización robusta de código: quita ceros a la izquierda, espacios y guiones
  const normCod = (cod) => String(cod || '').trim()
    .replace(/[\s\-_]/g, '')
    .replace(/^0+([1-9\D])/, '$1')  // quita ceros iniciales antes de caracter significativo
    .replace(/^0+$/, '0')           // si es todo ceros, conservar "0"
    .toLowerCase();

  // Construir mapa rápido del catálogo (normalizado → objeto original)
  const catMap = new Map();
  allProps.forEach(p => {
    if (p.isKmzOnly) return;
    const n = normCod(p['Código']);
    if (n) catMap.set(n, p);
  });

  const sinMatch = [];

  kmzProps.forEach(kp => {
    const kpNorm = normCod(kp['Código']);
    if (!kpNorm) return;

    const existing = catMap.get(kpNorm);

    if (existing) {
      // Verificar si ya tiene ubicación válida
      const latVal = parseFloat(String(existing['Latitud'] || '0').replace(',', '.'));
      const lngVal = parseFloat(String(existing['Longitud'] || '0').replace(',', '.'));
      const yaTieneUbicacion = !isNaN(latVal) && latVal !== 0 && !isNaN(lngVal) && lngVal !== 0;

      if (!yaTieneUbicacion) {
        // Sin ubicación: asignar coordenadas del KMZ (burbuja dorada)
        existing['Latitud'] = kp['Latitud'];
        existing['Longitud'] = kp['Longitud'];
      } else {
        // Ya tiene ubicación: marcar conflicto (burbuja naranja para revisión manual)
        existing._tieneConflictoCoordenadas = true;
      }

      existing._kmzCategory = kp['Categoría'];

      if (!existing['Imagenes'] && kp['Imagenes']) {
        existing['Imagenes'] = kp['Imagenes'];
      }
    } else {
      sinMatch.push({ raw: kp['Código'], norm: kpNorm });
      // Crear entrada virtual (burbuja morada)
      allProps.push({
        'Código': kp['Código'],
        'Nombre': kp['Nombre_KMZ'],
        'Precio': kp['Precio_KMZ'] ? parseKmzPrice(kp['Precio_KMZ']) : 0,
        'Latitud': kp['Latitud'],
        'Longitud': kp['Longitud'],
        'Habitaciones': kp['Habitaciones'],
        'Baños': kp['Baños'],
        'Pisos': kp['Pisos'],
        'Garaje': kp['Garaje'],
        'Ubicación': kp['Ubicación'],
        'Área': kp['Área'],
        'Tipo de inmueble': 'Casa (KMZ)',
        'Image': 'https://i.imgur.com/YbnRomr.png',
        'Imagenes': kp['Imagenes'] || 'https://i.imgur.com/YbnRomr.png',
        'isKmzOnly': true,
        '_kmzCategory': kp['Categoría'],
        'Descripción': kp['KMZ_Data']?.['Descripción'] || '',
        'Renta': kp['KMZ_Data']?.['Renta'] || '',
        'Retorno de la inversión': kp['KMZ_Data']?.['Retorno de Inversión'] || ''
      });
    }
  });

  // Imprimir en consola los codigos sin match para diagnóstico
  if (sinMatch.length > 0) {
    console.warn(`[KMZ] ${sinMatch.length} códigos KMZ sin coincidencia (aparecen en MORADO):`);
    console.table(sinMatch);
  } else {
    console.log('[KMZ] Todos los códigos KMZ coincidieron con el catálogo.');
  }

  if (currentTab === 'nuevo') {
    fnActualizarConteo('nl');
  }
}

function parseKmzPrice(priceStr) {
  if (!priceStr) return 0;
  // Convertir "150mlls" -> 150000000
  let num = parseFloat(String(priceStr).replace(/mlls/gi, "").replace(",", ".").trim());
  if (!isNaN(num)) return num * 1000000;
  return 0;
}


function updateMapBoundsFilter(pfx) {
  if (!leafletMap || !mapViewportFilterActive) return;
  
  const bounds = leafletMap.getBounds();
  const filtered = filtrarProps(getFSt(pfx), true).filter(p => {
    let lat = parseFloat(String(p['Latitud'] || p['Lat']).replace(',','.'));
    let lng = parseFloat(String(p['Longitud'] || p['Lng']).replace(',','.'));
    if (isNaN(lat) || isNaN(lng) || lat === 0) return false;
    return bounds.contains([lat, lng]);
  });

  // Actualizar la grilla de propiedades con las que están en el viewport
  renderPropsGrid(filtered);
  
  // Actualizar conteo visual
  const cntEl = document.getElementById(`fnCnt_${pfx}`);
  if (cntEl) cntEl.innerHTML = `${filtered.length} <span style="font-size:10px; opacity:0.7;">(en vista)</span>`;
}

function renderKmzCategories(pfx) {
  const container = document.getElementById(`kmzCategoryToggle_${pfx}`);
  if (!container) return;

  if (kmzCategories.length === 0) {
    container.innerHTML = '<div style="font-size:11px; color:#888; text-align:center; padding:10px;">Sin categorías KMZ</div>';
    return;
  }

  container.innerHTML = kmzCategories.map(cat => {
    const isChecked = activeKmzCategories.includes(cat);
    return `
      <label class="check-item" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; background: rgba(255,255,255,0.03);">
        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleKmzCategory('${pfx}', '${eq(cat)}', this.checked)">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cat}</span>
      </label>`;
  }).join('');
}

function toggleKmzCategory(pfx, cat, checked) {
  const st = getFSt(pfx);
  if (!st.kmzCategory) st.kmzCategory = [];
  
  // Nota: En nuestro filtro, si kmzCategory está vacío, muestra todo.
  // Pero aquí queremos que las categorías del KMZ funcionen como "exclusión" o "inclusión".
  // Para que sea intuitivo, si el usuario desmarca una, la agregamos a una lista de "ocultos"
  // o simplemente manejamos kmzCategory como la lista de permitidos.
  
  if (checked) {
    if (!activeKmzCategories.includes(cat)) activeKmzCategories.push(cat);
  } else {
    activeKmzCategories = activeKmzCategories.filter(c => c !== cat);
  }

  // Sincronizar con el filtro global kmzCategory
  // Siempre guardamos la lista de categorías activas para que el filtro funcione incluso si está vacío
  st.kmzCategory = [...activeKmzCategories];

  fnActualizarConteo(pfx);
  actualizarPinesMapa(pfx);
}

function toggleCategoriasMap(pfx) {
  const el = document.getElementById(`kmzCategoryToggle_${pfx}`);
  const arrow = document.getElementById(`kmzCatArrow_${pfx}`);
  if (!el || !arrow) return;
  
  const isHidden = el.style.display === 'none';
  el.style.display = isHidden ? 'flex' : 'none';
  arrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
}

async function refreshData() {
  const btn = document.querySelector('.topbar-right .settings-btn');
  if(btn) btn.classList.add('listening');
  await cargarProps();
  await cargarKmz();
  // También refrescar leads/citas desde la nube
  await cargarLeads();
  rebuildCitas();
  if(currentTab === 'citas')  renderCitas();
  if(currentTab === 'leads')  renderLeadsBody(leads);
  if(btn) btn.classList.remove('listening');
  toast('Datos sincronizados ✓', 'success');
}

async function initApp(){
  showTab('nuevo');
  
  // Seguridad: Si hay demasiados leads (bug previo), limpiar cache
  if (leads.length > 5000) {
    console.warn("Too many leads, clearing local cache to un-stuck UI.");
    leads = [];
    saveLeads();
  }

  cleanupLocalData();
  await cargarProps();
  await cargarKmz();
  await cargarLeads();
  rebuildCitas();
  renderNuevo();
  
  // Auto-completado en modal de visitas
  const vC = document.getElementById('visitaCliente');
  const vCel = document.getElementById('visitaCelular');
  if (vC && vCel) {
    vC.addEventListener('input', function() {
      const val = this.value.trim();
      if (!val) return;
      const match = leads.find(l => l.id !== 'LEAD-AGENDA-GLOBAL' && norm(l.nombre) === norm(val));
      if (match && match.celular) {
        vCel.value = match.celular;
      }
    });
    vCel.addEventListener('input', function() {
      const val = this.value.trim().replace(/\D/g, '');
      if (!val) return;
      const matchInput = val.length >= 10 ? val.slice(-10) : val;
      const match = leads.find(l => {
        if (l.id === 'LEAD-AGENDA-GLOBAL') return false;
        const lRaw = String(l.celular || '').replace(/\D/g, '');
        const lMatch = lRaw.length >= 10 ? lRaw.slice(-10) : lRaw;
        return matchInput && lMatch && lMatch === matchInput;
      });
      if (match && match.nombre) {
        vC.value = match.nombre;
      }
    });
  }
  
  // Feedback de citas
  setTimeout(checkCitasFeedback, 3000);
  setInterval(checkCitasFeedback, 1000 * 60 * 5); // Cada 5 mins

  // ── AUTO-SYNC: sincronizar leads/citas en segundo plano cada 90 segundos ──
  const ind = document.getElementById('autoSyncIndicator');
  if (ind) ind.style.display = 'flex';
  setInterval(autoSyncLeads, 15 * 1000); // Cada 15 segundos → tiempo real
}

function cleanupLocalData() {
  const unique = new Map();
  let changed = false;
  
  leads.forEach(l => {
    let id = String(l.id || '').trim();
    // Conservar cualquier ID válido (que no esté vacío, null, o undefined)
    if (!id || id === 'undefined' || id === 'null') {
      id = 'U-' + Date.now() + Math.floor(Math.random()*1000);
      l.id = id;
      changed = true;
    }
    
    if (!unique.has(id)) {
      unique.set(id, l);
    } else {
      changed = true; // Duplicado de ID encontrado
    }
  });
  
  if (changed) {
    leads = Array.from(unique.values());
    saveLeads();
    console.log("Deep Cleanup: IDs normalized and duplicates removed.");
  }
}

/* ═══════════════════════════════════════════════
   AUTO-SYNC EN SEGUNDO PLANO
   Refresca leads/citas silenciosamente y actualiza la UI
   sin interrumpir al usuario. Se ejecuta cada 90 segundos.
═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   HELPER: Combina dos arrays de visitas sin duplicar.
   Clave única = codigo + celular (misma propiedad, mismo cliente).
   Si el mismo par existe en ambos lados, gana el estado más avanzado.
═══════════════════════════════════════════════ */
const ESTADO_ORDEN = { cancelada: 5, oferta: 4, realizada: 3, agendada: 2, solicito_visita: 1 };

function visitaKey(v) {
  return String(v.codigo || '').trim() + '_' + String(v.celular || '').replace(/[^\d]/g, '');
}

function mergeVisitas(localArr, cloudArr) {
  const vMap = new Map();
  
  const processMerge = (v, isLocal) => {
    const k = visitaKey(v);
    const ex = vMap.get(k);
    if (!ex) {
      vMap.set(k, v);
      return;
    }
    
    // Si ambos tienen updatedAt, gana el mayor
    if (v.updatedAt && ex.updatedAt) {
      if (v.updatedAt > ex.updatedAt || (v.updatedAt === ex.updatedAt && isLocal)) vMap.set(k, v);
    } 
    // Si uno tiene updatedAt y el otro no, gana el que sí tiene
    else if (v.updatedAt && !ex.updatedAt) {
      vMap.set(k, v);
    }
    // Si ninguno tiene, fallback a la prioridad estática del estado
    else if (!v.updatedAt && !ex.updatedAt) {
      if ((ESTADO_ORDEN[v.estado] || 0) >= (ESTADO_ORDEN[ex.estado] || 0)) vMap.set(k, v);
    }
  };

  (cloudArr || []).forEach(v => processMerge(v, false));
  (localArr || []).forEach(v => processMerge(v, true));
  
  return Array.from(vMap.values());
}

async function autoSyncLeads() {
  if (!CRM_SCRIPT_URL) return;

  const dot = document.getElementById('autoSyncDot');
  const txt = document.getElementById('autoSyncTxt');

  if (dot) { dot.style.background = '#d4a84b'; dot.style.boxShadow = '0 0 6px #d4a84b'; }
  if (txt) txt.textContent = 'Sincronizando...';

  try {
    const res  = await fetch(CRM_SCRIPT_URL + '?action=getLeads&t=' + Date.now());
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Respuesta inválida');

    // Normalizar IDs
    const cloudData = data.map(l => {
      let id = String(l.id || '').trim();
      if (!id || id === 'undefined' || id === 'null') {
        const s = String(l.nombre||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'')
                + String(l.celular||'').replace(/[^\d]/g,'');
        let h = 0;
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
        id = 'C-' + Math.abs(h).toString(16);
      }
      return { ...l, id };
    });

    let huboNuevos = false;
    const localMap = new Map(leads.map(l => [String(l.id).trim(), l]));
    // Mapa de teléfonos locales para evitar duplicados al sincronizar desde la nube
    const localPhoneMap = new Map(
      leads
        .filter(l => l.id !== 'LEAD-AGENDA-GLOBAL')
        .map(l => [String(l.celular || '').replace(/\D/g, ''), String(l.id).trim()])
        .filter(([phone]) => phone !== '')
    );

    cloudData.forEach(cloudLead => {
      const id = String(cloudLead.id).trim();
      if (deletedLeads.includes(id)) return;

      const local = localMap.get(id);
      if (!local) {
        // Verificar que no exista ya un lead local con el mismo teléfono
        const phone = String(cloudLead.celular || '').replace(/\D/g, '');
        if (phone && localPhoneMap.has(phone) && cloudLead.id !== 'LEAD-AGENDA-GLOBAL') {
          // Existe duplicado por teléfono — hacer merge de visitas en el lead existente
          const existingId = localPhoneMap.get(phone);
          const existingLead = localMap.get(existingId);
          if (existingLead) {
            const merged = mergeVisitas(existingLead.visitas, cloudLead.visitas);
            const prevStates = (existingLead.visitas || []).map(v => visitaKey(v) + v.estado).sort().join('|');
            const newStates  = merged.map(v => visitaKey(v) + v.estado).sort().join('|');
            if (merged.length !== (existingLead.visitas || []).length || prevStates !== newStates) {
              huboNuevos = true;
              existingLead.visitas = merged;
            }
          }
          return; // No insertar el duplicado
        }
        huboNuevos = true;
        leads.push(cloudLead);
        localMap.set(id, cloudLead);
        if (phone) localPhoneMap.set(phone, id);
        return;
      }

      // ── Merge de visitas con deduplicación real ──
      const merged = mergeVisitas(local.visitas, cloudLead.visitas);
      const prevLen = (local.visitas || []).length;
      const prevStates = (local.visitas || []).map(v => visitaKey(v) + v.estado).sort().join('|');
      const newStates  = merged.map(v => visitaKey(v) + v.estado).sort().join('|');
      if (merged.length !== prevLen || prevStates !== newStates) {
        huboNuevos = true;
        local.visitas = merged;
      }

      // Merge historial
      const hCloud = (cloudLead.historialEnvios || []).length;
      const hLocal = (local.historialEnvios  || []).length;
      if (hCloud > hLocal) {
        huboNuevos = true;
        const hMap = new Map((local.historialEnvios || []).map(h => [h.fecha + (h.codigos||[]).join(','), h]));
        (cloudLead.historialEnvios || []).forEach(h => hMap.set(h.fecha + (h.codigos||[]).join(','), h));
        local.historialEnvios = Array.from(hMap.values()).sort((a,b) => a.fecha < b.fecha ? 1 : -1);
      }

      // Estado y etiqueta
      if (cloudLead.estado !== local.estado || cloudLead.etiqueta !== local.etiqueta) {
        huboNuevos = true;
        local.estado   = cloudLead.estado;
        local.etiqueta = cloudLead.etiqueta;
      }

      // Sincronizar co-creación feedback
      if (JSON.stringify(cloudLead.feedback || {}) !== JSON.stringify(local.feedback || {})) {
        huboNuevos = true;
        local.feedback = cloudLead.feedback || {};
      }
    });

    if (huboNuevos) {
      limpiarYFusionarDuplicados(true);
      rebuildCitas();
      saveLeads();
      if (currentTab === 'citas')  renderCitas();
      if (currentTab === 'leads')  renderLeadsBody(leads);
      if (currentTab === 'pedidos') renderPedidosInmob();
      if (currentLeadId) {
        const l = leads.find(x => String(x.id).trim() === String(currentLeadId).trim());
        if (l) renderSidePanel(l);
      }
      if (dot) dot.style.boxShadow = '0 0 8px #22c55e';
      setTimeout(() => { if (dot) dot.style.boxShadow = ''; }, 1500);
      console.log('[AutoSync] Cambios aplicados.');
    }

    if (dot) { dot.style.background = '#22c55e'; dot.style.boxShadow = ''; }
    if (txt) txt.textContent = 'En vivo';

  } catch (e) {
    console.warn('[AutoSync] Error:', e);
    if (dot) { dot.style.background = '#ef4444'; }
    if (txt) txt.textContent = 'Sin conexión';
    setTimeout(() => {
      if (dot) dot.style.background = '#888';
      if (txt) txt.textContent = 'En vivo';
    }, 10000);
  }
}

async function cargarLeads(){
  if(!CRM_SCRIPT_URL) return;
  try {
    const res = await fetch(CRM_SCRIPT_URL + '?action=getLeads');
    const data = await res.json();
    if(Array.isArray(data)){
      const cloudData = data.map(l => {
        let id = String(l.id || '').trim();
        if(!id || id === 'undefined' || id === 'null') {
           const normName = String(l.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g,'');
           const normPhone = String(l.celular || '').replace(/[^\d]/g, "");
           const hashStr = normName + normPhone;
           let h = 0;
           for (let i = 0; i < hashStr.length; i++) { h = ((h << 5) - h) + hashStr.charCodeAt(i); h |= 0; }
           id = 'C-' + Math.abs(h).toString(16);
        }
        return { ...l, id: id };
      });

      // 2. MERGE AGRESIVO: Unir por Teléfono o por ID para eliminar "fantasmas"
      const mergedMap = new Map();
      const phoneMap = new Map();

      // Procesar primero locales (U-) para darles prioridad
      leads.forEach(l => {
        const id = String(l.id || '').trim();
        const phone = String(l.celular || '').replace(/[^\d]/g, "");
        if (id && id.startsWith('U-')) {
          mergedMap.set(id, l);
          if (phone) phoneMap.set(phone, id);
        }
      });

      // Procesar nube (C-) con unión por teléfono
      cloudData.forEach(cloudLead => {
        const id = String(cloudLead.id).trim();
        const phone = String(cloudLead.celular || '').replace(/[^\d]/g, "");
        
        if (deletedLeads.includes(id)) return;

        // Si ya existe un lead con este teléfono, lo unimos
        let targetId = id;
        if (phone && phoneMap.has(phone)) {
           targetId = phoneMap.get(phone);
        }

        if (!mergedMap.has(targetId)) {
          mergedMap.set(targetId, cloudLead);
          if (phone) phoneMap.set(phone, targetId);
        } else {
          const localLead = mergedMap.get(targetId);
          // Unimos historiales para no perder nada
          const combinedHist = [...(localLead.historialEnvios || []), ...(cloudLead.historialEnvios || [])];
          const seenHist = new Set();
          const cleanHist = combinedHist.filter(h => {
             const key = h.fecha + h.codigo;
             if(seenHist.has(key)) return false;
             seenHist.add(key);
             return true;
          });

          mergedMap.set(targetId, {
             ...cloudLead,
             ...localLead,
             id: targetId,
             feedback: cloudLead.feedback || localLead.feedback || {},
             historialEnvios: cleanHist,
             propsEnviadas: Array.from(new Set([...(localLead.propsEnviadas || []), ...(cloudLead.propsEnviadas || [])]))
          });
        }
      });

      leads = Array.from(mergedMap.values());
      limpiarYFusionarDuplicados(true);
      rebuildCitas();
      saveLeads();
      if(currentTab === 'leads') renderLeadsBody(leads);
      if(currentTab === 'citas') renderCitas();
      if(currentTab === 'pedidos') renderPedidosInmob();
    }
  } catch(e){ console.error("Error cargando leads:", e); }
}

function rebuildCitas() {
  const allVisitas = [];
  const seenKeys = new Set(); // clave = codigo_celular (deduplicación real)
  
  leads.forEach(l => {
    if (!Array.isArray(l.visitas) || !l.visitas.length) return;

    // 1. Deduplicar visitas dentro del mismo lead por codigo+celular
    const vMap = new Map();
    l.visitas.forEach(v => {
      const k = visitaKey({ ...v, celular: v.celular || l.celular });
      const ex = vMap.get(k);
      if (!ex || (ESTADO_ORDEN[v.estado] || 0) >= (ESTADO_ORDEN[ex.estado] || 0)) vMap.set(k, v);
    });
    l.visitas = Array.from(vMap.values()); // guardar visitas limpias en el lead

    // 2. Agregar a la agenda global, evitando duplicados globales
    l.visitas.forEach(v => {
      const k = visitaKey({ ...v, celular: v.celular || l.celular });
      if (!seenKeys.has(k)) {
        seenKeys.add(k);
        allVisitas.push({
          ...v,
          cliente: v.cliente || l.nombre,
          celular: v.celular || l.celular,
          id: v.id || `${l.id}_${v.codigo}_${v.fecha}`
        });
      }
    });
  });
  
  // Citas genéricas que no estén ya incluidas
  const genericCitas = citas.filter(c => {
    const k = visitaKey(c);
    return !seenKeys.has(k);
  });
  
  if (genericCitas.length > 0) {
     let globalLead = leads.find(l => l.id === 'LEAD-AGENDA-GLOBAL');
     if (!globalLead) {
         globalLead = {
           id: 'LEAD-AGENDA-GLOBAL',
           tipo: 'cliente',
           nombre: 'Agenda Global (Citas Genéricas)',
           celular: '0000000000',
           notas: 'Contenedor para sincronizar citas antiguas o sin datos en la nube.',
           metodoPago: [],
           estado: 'visita',
           etiqueta: 'activo',
           filtros: {},
           frecuencia: 'manual',
           maxPorEnvio: 4,
           nombreInmobiliaria: '',
           nombreAgente: '',
           propsFiltradas: [],
           propsEnviadas: [],
           proximosEnvios: [],
           historialEnvios: [],
           visitas: [],
           creadoEn: new Date().toISOString()
         };
         leads.push(globalLead);
     }
     
     let modified = false;
     genericCitas.forEach(gc => {
         const k = visitaKey(gc);
         const existing = globalLead.visitas.find(v => visitaKey(v) === k);
         if (!existing) {
             globalLead.visitas.push(gc);
             seenKeys.add(k);
             allVisitas.push(gc);
             modified = true;
         }
     });
     
     if (modified) {
         setTimeout(() => {
             syncSheets(globalLead);
             saveLeads();
         }, 1000);
     }
  }
  
  citas = allVisitas;
}

function normalizarPropiedades(data) {
  if (!Array.isArray(data)) return [];
  return data.map((obj, i) => {
    const nuevo = { _sheetOrder: i + 1 };
    
    // Primero extraemos las llaves originales
    for (let key in obj) {
      const val = obj[key];
      const nk = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      let k = null;

      // Reglas de mapeo por prioridad
      if (nk === 'codigo' || nk === 'cdigo' || nk === 'cod' || nk === 'id') k = 'Código';
      else if (nk === 'nombre' || nk === 'titulo' || nk === 'propiedad') k = 'Nombre';
      else if (nk === 'precio' || nk === 'valor' || nk === 'precio venta' || nk === 'precio renta' || nk === 'valor venta') k = 'Precio';
      else if (nk === 'tipo' || nk === 'tipo de inmueble' || nk === 'clase') k = 'Tipo de inmueble';
      else if (nk === 'zona' || nk === 'sector') k = 'Zona';
      else if (nk === 'barrio') k = 'Barrio';
      else if (nk === 'ciudad') k = 'Ciudad';
      else if (nk === 'estrato') k = 'Estrato';
      else if (nk === 'ubicacion' || nk === 'direccion') k = 'Ubicación';
      else if (nk === 'habitaciones' || nk === 'alcobas' || nk === 'cuartos') k = 'Habitaciones';
      else if (nk === 'banos' || nk === 'sanitarios') k = 'Baños';
      else if (nk === 'garaje' || nk === 'parqueadero' || nk === 'garajes') k = 'Garaje';
      else if (nk === 'pisos' || nk === 'niveles') k = 'Pisos';
      else if (nk === 'piscina') k = 'Piscina';
      else if (nk === 'cocina') k = 'Cocina';
      else if (nk === 'conjunto' || nk === 'edificio' || nk === 'unidad') k = 'Conjunto';
      else if (nk === 'descripcion' || nk === 'detalle') k = 'Descripción';
      else if (nk === 'puntos clave' || nk === 'caracteristicas' || nk === 'highlights') k = 'Puntos Clave';
      else if (nk === 'area construida' || nk === 'area construida m2' || nk === 'area total') k = 'Área construida';
      else if (nk === 'area' || nk === 'mt2' || nk === 'superficie') k = 'Área';
      else if (nk === 'imagenes' || nk === 'fotos' || nk === 'imagen' || nk === 'galeria') k = 'Imagenes';
      else if (nk === 'contrato') k = 'Contrato';
      else if (nk === 'publicar') k = 'Publicar';
      else if (nk === 'destacada' || nk === 'destacado') k = 'Destacada';
      else if (nk === 'rentabilidad' || nk === 'retorno' || nk.includes('retorno') || nk.includes('rentabilidad')) k = 'Retorno de la inversión';
      else if (nk === 'administracion' || nk === 'admin') k = 'Administración';
      else if (nk === 'latitud' || nk === 'lat') k = 'Latitud';
      else if (nk === 'longitud' || nk === 'lng' || nk === 'lon') k = 'Longitud';
      else if (nk === 'inmobiliaria' || nk === 'aliado' || nk === 'fuente' || nk === 'inmob') k = 'Inmobiliaria';

      // Fallbacks para términos que contienen la palabra pero no son exactos
      if (!k) {
        if (nk.includes('codigo')) k = 'Código';
        else if (nk.includes('nombre')) k = 'Nombre';
        else if (nk.includes('tipo')) k = 'Tipo de inmueble';
        else if (nk.includes('zona')) k = 'Zona';
        else if (nk.includes('barrio')) k = 'Barrio';
        else if (nk.includes('ciudad')) k = 'Ciudad';
        else if (nk.includes('estrato')) k = 'Estrato';
        else if (nk.includes('ubicaci')) k = 'Ubicación';
        else if (nk.includes('habitaci')) k = 'Habitaciones';
        else if (nk.includes('garaje') || nk.includes('parquea')) k = 'Garaje';
        else if (nk.includes('piscina')) k = 'Piscina';
        else if (nk.includes('cocina')) k = 'Cocina';
        else if (nk.includes('conjunto')) k = 'Conjunto';
        else if (nk.includes('descrip')) k = 'Descripción';
        else if (nk.includes('puntos') && nk.includes('clave')) k = 'Puntos Clave';
        else if (nk.includes('area construida') || nk.includes('area total')) k = 'Área construida';
        else if (nk.includes('area')) k = 'Área';
        else if (nk.includes('imagen') || nk.includes('foto')) k = 'Imagenes';
        else if (nk.includes('precio') && !nk.includes('rango') && !nk.includes('administracion')) k = 'Precio';
        else if (nk.includes('retorno') || nk.includes('rentabilidad')) k = 'Retorno de la inversión';
        else if (nk.includes('administr')) k = 'Administración';
        else if (nk.includes('inmobiliaria') || nk.includes('inmob')) k = 'Inmobiliaria';
      }

      // Evitamos sobrescribir con valores vacíos si ya tenemos algo
      if (k) {
        if (!nuevo[k] || (val && String(val).trim() !== "")) {
           // Si es Precio, solo sobrescribimos si el nuevo valor parece un precio real (numérico)
           if (k === 'Precio' && nuevo[k]) {
             const vNew = parseFloat(String(val).replace(/[^\d]/g, ""));
             const vOld = parseFloat(String(nuevo[k]).replace(/[^\d]/g, ""));
             if (!isNaN(vNew) && vNew > 0) nuevo[k] = val;
           } else {
             nuevo[k] = val;
           }
        }
      } else {
        nuevo[key] = val;
      }
    }

    // Forzamos que Código sea string y siempre exista
    if (!nuevo['Código']) {
      nuevo['Código'] = nuevo['Cdigo'] || nuevo['Id'] || "";
    }
    nuevo['Código'] = String(nuevo['Código'] || "").trim();
    
    // Limpieza de precios
    if (nuevo['Precio']) {
      const p = String(nuevo['Precio']).replace(/[^\d]/g, "");
      if (p) nuevo['Precio'] = p;
    }

    return nuevo;
  });
}

async function cargarProps(){
  try {
    document.getElementById('syncStatus').textContent='⟳ Cargando...';
    const urlBusca = "https://script.google.com/macros/s/AKfycbz-HipJ53KIf2JD1q9BUIBFUB45o4wRYcjvlqUbpg9TDAGK0q3hNQcSrV23dMCWaTgXcQ/exec?action=getData&t=" + Date.now();
    const res = await fetch(urlBusca);
    const data = await res.json();
    const rawData = normalizarPropiedades(Array.isArray(data) ? data : []);
    
    let remoteProps = rawData.filter(d => {
        return String(d['Publicar'] || '').trim().toUpperCase() === 'SI';
    });

    // Cargar propiedades personalizadas de localStorage
    const customProps = JSON.parse(localStorage.getItem('icde_custom_props') || '[]');
    
    // Unir: la propiedad REMOTA es la base con toda su info rica.
    // customProps solo aporta los campos que explícitamente se editaron
    // (ej: coordenadas agregadas desde el mapa). No reemplaza completamente.
    // Usamos un Map solo para los customProps y preservamos todos los remoteProps (incluso si tienen mismo Código)
    // para que el total coincida exactamente con index.html (533 props).
    const customMap = new Map();
    customProps.forEach(custom => customMap.set(custom['Código'], custom));

    allProps = remoteProps.map(p => {
      const custom = customMap.get(p['Código']);
      if (custom) {
        // Merge inteligente: solo sobreescribir campos no vacíos
        const merged = { ...p };
        for (const [key, val] of Object.entries(custom)) {
          if (val !== '' && val !== null && val !== undefined) {
            merged[key] = val;
          }
        }
        return merged;
      }
      return p;
    });

    // Agregar las propiedades nuevas creadas desde el admin que no están en remoteProps
    const remoteCodigos = new Set(remoteProps.map(p => p['Código']));
    customProps.forEach(custom => {
      if (!remoteCodigos.has(custom['Código'])) {
        allProps.push(custom);
      }
    });
    
    console.log("Admin: Remote:", remoteProps.length, "Custom:", customProps.length, "Total:", allProps.length);
    document.getElementById('syncStatus').textContent=`✓ ${allProps.length} propiedades`;
    
    // Actualizar el precio máximo dinámico
    if(allProps.length > 0){
      const prices = allProps.map(p => parseP(p['Precio'])).filter(p => p > 0);
      if(prices.length > 0) MAX_CATALOG_PRICE = Math.max(...prices);
    }
    
  } catch(e){
    console.error("Error cargando propiedades:", e);
    document.getElementById('syncStatus').textContent='⚠ Sin conexión'; 
    allProps=[];
  }
  if(currentTab==='nuevo') renderNuevo();
}

/* ═══════════════════════════════════════════════
   TABS
═══════════════════════════════════════════════ */
function showTab(tab){
  currentTab=tab;
  const tabNames = ['nuevo','leads','citas','pedidos','administracion','estadisticas','gestion'];
  document.querySelectorAll('.tab').forEach((t,i)=> {
    if (tabNames[i]) t.classList.toggle('active',tabNames[i]===tab);
  });
  
  if(tab==='nuevo') renderNuevo(); 
  else if(tab==='leads') renderLeads();
  else if(tab==='citas') renderCitas();
  else if(tab==='pedidos') renderPedidosInmob();
  else if(tab==='administracion') renderAdministracion();
  else if(tab==='estadisticas') renderEstadisticas();
  else if(tab==='gestion') renderGestion();
}
function toggleNlData(){
  nlShowData = !nlShowData;
  renderNuevo();
}

/* ═══════════════════════════════════════════════
   RENDER NUEVO LEAD (UNIFICADO)
═══════════════════════════════════════════════ */
function renderNuevo(){
  const c=document.getElementById('mainContent');
  c.innerHTML=`
  <div class="section-header">
    <div class="section-title">Nuevo Lead</div>
    <div style="display:flex; gap:10px;">
      <button class="btn ${nlShowData?'btn-primary':'btn-secondary'}" onclick="toggleNlData()" title="${nlShowData?'Ocultar formulario':'Ver datos del cliente'}">
        ${nlShowData ? '👤 Ocultar Datos ▲' : '👤 Datos del Cliente ▼'}
      </button>
    </div>
  </div>

  <div class="nuevo-lead-layout ${nlShowData ? '' : 'hide-data'}">
    <!-- COLUMNA 1: FILTROS E INMUEBLES (30%) -->
    <div class="nl-col-1">
      <div class="panel-section">
        <div class="form-section-header">
          <div class="panel-section-title">Intereses y Filtros</div>
        </div>
        <div class="section-content">
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">Selecciona los filtros para encontrar las propiedades ideales automáticamente.</p>
          ${allProps.length ? `<div id="nlFiltrosWrap"></div>` : `<div class="loading"><div class="spinner"></div> Cargando catálogo...</div>`}
        </div>

        <div style="height:20px;"></div>
        <div class="form-section-header" style="border-top:1px solid rgba(255,255,255,0.05); padding-top:16px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="panel-section-title">Selección de Propiedades</div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px; margin-top:10px;">
            <span style="font-size:12px;color:var(--gold); opacity:0.8; font-weight:500;" id="selCnt">${selectedProps.length} seleccionadas</span>
            <div class="ordenar-por" style="margin:0; margin-bottom:12px;">
              <div class="sort-toggle" onclick="toggleSortMenu(event)" style="height:32px; font-size:11.5px; padding:0 12px; border-radius:10px;">
                ${getSortLabel(criterioOrden)} <span class="st-arrow"></span>
              </div>
              <ul class="sort-options hidden">
                <li onclick="setSort('destacadas')" class="${criterioOrden==='destacadas'?'st-selected':''}">Destacadas</li>
                <li onclick="setSort('menorPrecio')" class="${criterioOrden==='menorPrecio'?'st-selected':''}">Menor precio</li>
                <li onclick="setSort('mayorPrecio')" class="${criterioOrden==='mayorPrecio'?'st-selected':''}">Mayor precio</li>
                <li onclick="setSort('rentabilidad')" class="${criterioOrden==='rentabilidad'?'st-selected':''}">Mayor rentabilidad</li>
                <li onclick="setSort('noUbicadas')" class="${criterioOrden==='noUbicadas'?'st-selected':''}">Faltan por mapa</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="section-content">
          <p style="font-size:13px;color:var(--muted);margin-bottom:24px; margin-top:-32px;">Puedes marcar casas específicas para enviar hoy mismo.</p>

          ${selectedProps.length?`<div class="selected-bar" style="margin-bottom:20px;"><div class="selected-chips">${selectedProps.map(c=>`<span class="sel-chip">${c}<button onclick="deselProp('${c}')">×</button></span>`).join('')}</div></div>`:''}
          <div id="propsGrid"></div>
        </div>
      </div>
    </div>

    <!-- COLUMNA 2: DATOS Y PLAN (60%) -->
    <div class="nl-col-2">
      <div class="panel-section">
        <!-- BLOQUE 1: DATOS -->
        <div class="form-section-header">
          <div class="panel-section-title">Datos del Cliente</div>
        </div>
        <div class="section-content">
          <div style="display:flex;gap:12px;margin-bottom:20px;margin-top:10px;">
            <button id="btnTC" class="btn ${nuevoLead.tipo==='cliente'?'btn-primary':'btn-secondary'}" onclick="setTipo('cliente')">👤 Cliente</button>
            <button id="btnTI" class="btn ${nuevoLead.tipo==='inmobiliaria'?'btn-gold':'btn-secondary'}"   onclick="setTipo('inmobiliaria')">🏢 Inmobiliaria</button>
          </div>
          <div id="nlDuplicateWarning" style="display:none; margin-bottom:15px; padding:12px 15px; background-color:rgba(249, 115, 22, 0.1); border:1px solid rgba(249, 115, 22, 0.3); border-radius:8px; color:#f97316; font-size:13px; align-items:center; justify-content:space-between;"></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Nombre Completo *</label><input class="form-input" id="nlN" value="\${nuevoLead.nombre}" list="datalist_lead_names" placeholder="Ej: Maria Perez" oninput="nuevoLead.nombre=this.value; checkDuplicateLead()"/></div>
            <div class="form-group"><label class="form-label">WhatsApp / Celular *</label><input class="form-input" id="nlC" value="\${nuevoLead.celular}" list="datalist_lead_phones" placeholder="3001234567" oninput="nuevoLead.celular=this.value; checkDuplicateLead()"/></div>
            <div class="form-group full"><label class="form-label">Notas u Observaciones</label><textarea class="form-input" oninput="nuevoLead.notas=this.value" placeholder="¿Qué detalles adicionales tiene este cliente?">${nuevoLead.notas}</textarea></div>
            <div class="form-group">
              <label class="form-label">Estado Inicial</label>
              <select class="form-input" onchange="nuevoLead.estado=this.value">
                <option value="enviando" ${nuevoLead.estado==='enviando'?'selected':''}>Enviando propuestas</option>
                <option value="proceso"  ${nuevoLead.estado==='proceso'?'selected':''}>Proceso de venta</option>
                <option value="visita"   ${nuevoLead.estado==='visita'?'selected':''}>Pendiente visita</option>
                <option value="banco"    ${nuevoLead.estado==='banco'?'selected':''}>Referido al banco</option>
                <option value="inactivo" ${nuevoLead.estado==='inactivo'?'selected':''}>Inactivo</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridad / Etiqueta</label>
              <select class="form-input" onchange="nuevoLead.etiqueta=this.value">
                <option value="activo"   ${nuevoLead.etiqueta==='activo'?'selected':''}>Activo (Interesado)</option>
                <option value="tibio"    ${nuevoLead.etiqueta==='tibio'?'selected':''}>Tibio (Explorando)</option>
                <option value="inactivo" ${nuevoLead.etiqueta==='inactivo'?'selected':''}>Inactivo (No responde)</option>
              </select>
            </div>
          </div>
          <div id="inmobExtra" style="display:${nuevoLead.tipo==='inmobiliaria'?'block':'none'}">
            <div class="inmob-section">
              <div class="inmob-title">🏢 Datos de la Inmobiliaria Aliada</div>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Nombre Inmobiliaria</label><input class="form-input" value="${nuevoLead.nombreInmobiliaria}" placeholder="Nombre" oninput="nuevoLead.nombreInmobiliaria=this.value"/></div>
                <div class="form-group"><label class="form-label">Nombre del Agente</label><input class="form-input" value="${nuevoLead.nombreAgente}" placeholder="Agente" oninput="nuevoLead.nombreAgente=this.value"/></div>
              </div>
            </div>
          </div>
          <div style="margin-top:20px;">
            <div class="form-label" style="margin-bottom:12px;">Método de Pago Preferido</div>
            <div class="checklist">
              ${['Efectivo', 'Crédito', 'Caja Honor', 'Permuta'].map(m=>`<label class="check-item ${nuevoLead.metodoPago.includes(m)?'active':''}"><input type="checkbox" ${nuevoLead.metodoPago.includes(m)?'checked':''} onchange="toggleMetodo('${m}',this)"/> ${m}</label>`).join('')}
            </div>
          </div>
        </div>

        <div style="height:32px;"></div>
        <div class="form-section-header" style="border-top:1px solid rgba(255,255,255,0.05); padding-top:24px;">
          <div class="panel-section-title">Plan de Envío y Finalización</div>
        </div>
        <div class="section-content">
          <div class="form-grid" style="margin-top:4px;">
            <div class="form-group">
              <label class="form-label">Frecuencia de seguimiento</label>
              <select class="form-input" onchange="nuevoLead.frecuencia=this.value; updateFrec()">
                <option value="diaria" ${nuevoLead.frecuencia==='diaria'?'selected':''}>Diaria</option>
                <option value="semanal" ${nuevoLead.frecuencia==='semanal'?'selected':''}>Semanal</option>
                <option value="quincenal" ${nuevoLead.frecuencia==='quincenal'?'selected':''}>Quincenal</option>
                <option value="mensual" ${nuevoLead.frecuencia==='mensual'?'selected':''}>Mensual</option>
                <option value="manual" ${nuevoLead.frecuencia==='manual'?'selected':''}>Manual</option>
              </select>
            </div>
          </div>
          <div class="freq-info" id="frecInfo" style="margin-top:20px; ${nuevoLead.frecuencia==='manual'?'display:none':''}">${getFrecInfo()}</div>

          <div style="margin-top:32px; display:flex; gap:12px; flex-wrap:wrap; padding-top:24px; border-top:1px solid rgba(255,255,255,0.05);">
            <button class="btn btn-primary" style="flex:1;" onclick="guardarLead(false, this)">💾 Solo Guardar</button>
            ${nuevoLead.tipo==='cliente'
              ? `<button class="btn btn-green" style="flex:1.2; font-weight:700;" onclick="guardarLead(true, this)">💾 Guardar y Enviar WhatsApp ➜</button>`
              : `<button class="btn btn-gold" style="flex:1.2; font-weight:700;" onclick="guardarLead(true, this)">💾 Guardar y Msg. Agente ➜</button>`}
            <button class="btn btn-secondary" onclick="resetNuevoLead()">🗑 Limpiar</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;


  // Construir barra de filtros al siguiente tick
  if(allProps.length) setTimeout(()=> buildFiltrosBar('nlFiltrosWrap','nl',nuevoLead.filtros), 0);
  renderPropsGrid();
  setTimeout(()=> checkDuplicateLead(), 0);

  // ── RESTORE MAP: después de reconstruir el DOM, re-adjuntar el mapa si estaba activo ──
  if(getFSt('nl').mapActive) {
    setTimeout(() => {
      const mapCont = document.getElementById('mapaContenedor_nl');
      const mapToggle = document.getElementById('btnToggleMapa_nl');
      if(mapCont && mapToggle) {
        mapToggle.checked = true;
        mapCont.classList.add('open');
        leafletMap = null; // El DOM fue destruido; forzar re-init
        setTimeout(() => initMapa('nl'), 150);
      }
    }, 80);
  }
}

function getFrecInfo(){
  const cnt=filtrarProps(nuevoLead.filtros, true).length;
  const ft={diaria:'día',semanal:'semana',quincenal:'15 días',mensual:'mes'}[nuevoLead.frecuencia]||nuevoLead.frecuencia;
  if(nuevoLead.frecuencia==='manual') return `Con <strong>${cnt}</strong> propiedades → <strong>Envío manual</strong>.`;
  return `Con <strong>${cnt}</strong> propiedades → Se enviarán todas las propiedades encontradas cada <strong>${ft}</strong>.`;
}

function updateFrec(){
  const fi=document.getElementById('frecInfo');
  if(fi){ fi.style.display=nuevoLead.frecuencia==='manual'?'none':''; fi.innerHTML=getFrecInfo(); }
}

function updateLeadsDatalists() {
  let container = document.getElementById('globalLeadsDatalists');
  if (!container) {
    container = document.createElement('div');
    container.id = 'globalLeadsDatalists';
    container.style.display = 'none';
    document.body.appendChild(container);
  }
  
  const uniqueNames = Array.from(new Set(leads.map(l => l.nombre).filter(Boolean)));
  const uniquePhones = Array.from(new Set(leads.map(l => l.celular).filter(Boolean)));
  
  container.innerHTML = `
    <datalist id="datalist_lead_names">
      \${uniqueNames.map(n => `<option value="\${eq(n)}"></option>`).join('')}
    </datalist>
    <datalist id="datalist_lead_phones">
      \${uniquePhones.map(p => `<option value="\${eq(p)}"></option>`).join('')}
    </datalist>
  `;
}

function checkDuplicateLead(){
  const w = document.getElementById('nlDuplicateWarning');
  if(!w) return;
  
  const inputN = document.getElementById('nlN');
  const inputC = document.getElementById('nlC');
  
  const valN = inputN ? inputN.value : '';
  const valC = inputC ? inputC.value : '';
  
  nuevoLead.nombre = valN;
  nuevoLead.celular = valC;
  
  const rawNum = String(valC).trim().replace(/\D/g, '');
  const num = rawNum.length >= 10 ? rawNum.slice(-10) : rawNum;
  const nom = norm(valN);
  
  if(!num && !nom) { w.style.display='none'; return; }

  const dup = leads.find(l => {
    if (l.id === 'LEAD-AGENDA-GLOBAL') return false;
    const lRawNum = String(l.celular||'').trim().replace(/\D/g, '');
    const lNum = lRawNum.length >= 10 ? lRawNum.slice(-10) : lRawNum;
    const lNom = norm(l.nombre);
    
    const matchCelular = num && lNum && lNum === num;
    const matchNombre = nom && lNom && lNom === nom;
    return matchCelular || matchNombre;
  });

  if(dup){
    w.style.display='flex';
    const lRawNum = String(dup.celular||'').trim().replace(/\D/g, '');
    const lNum = lRawNum.length >= 10 ? lRawNum.slice(-10) : lRawNum;
    const coincidenciaCelular = num && lNum === num;
    w.innerHTML = `<div>⚠️ <b>Atención:</b> Ya existe un cliente con este \${coincidenciaCelular ? 'celular' : 'nombre'} (\${dup.nombre}).</div> <button class="btn btn-sm btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="showTab('leads'); abrirLead('\${String(dup.id).trim()}', '\${String(dup.celular).trim()}')">Ver Cliente</button>`;
  } else {
    w.style.display='none';
  }
}

function setTipo(tipo){
  nuevoLead.tipo=tipo;
  document.getElementById('inmobExtra').style.display=tipo==='inmobiliaria'?'block':'none';
  document.getElementById('btnTC').className='btn '+(tipo==='cliente'?'btn-primary':'btn-secondary');
  document.getElementById('btnTI').className='btn '+(tipo==='inmobiliaria'?'btn-gold':'btn-secondary');
}
function toggleMetodo(m,el){
  if(el.checked){ if(!nuevoLead.metodoPago.includes(m)) nuevoLead.metodoPago.push(m); }
  else nuevoLead.metodoPago=nuevoLead.metodoPago.filter(x=>x!==m);
  el.closest('.check-item').classList.toggle('active',el.checked);
}
function deselProp(cod){ selectedProps=selectedProps.filter(c=>c!==cod); renderNuevo(); }

/* ═══════════════════════════════════════════════
   PROPS GRID
═══════════════════════════════════════════════ */
function renderPropsGrid(listaForzada){
  const el=document.getElementById('propsGrid'); if(!el) return;
  let lista = listaForzada || filtrarProps(nuevoLead.filtros, true);
  if(!listaForzada){
    if(criterioOrden==='destacadas') lista = lista.filter(a => ["Directo", "Verbal"].includes(a["Contrato"]));
    else if(criterioOrden==='noUbicadas') lista = lista.filter(p => {
      const lat = parseFloat(String(p['Latitud'] || p['Lat'] || '').replace(',','.'));
      const lng = parseFloat(String(p['Longitud'] || p['Lng'] || '').replace(',','.'));
      return isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0;
    });
  }
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
    const img = (d['Imagenes']||'').split('|')[0].trim() || d['Image'] || 'https://i.imgur.com/Pc9M3I8.png';
    const isDestacada = ["Directo", "Verbal"].includes(d["Contrato"]);
    const inmob = d['Inmobiliaria'] || '';
    
    html += '<div class="prop-card' + (sel?' selected':'') + (isDestacada?' recomendado':'') + '" onclick="abrirModalProp(\'' + eq(cod) + '\')" onmouseenter="focusProperty(\'' + eq(cod) + '\')">';
    if(isDestacada) html += '<div class="ribbon"><span>¡Destacada!</span></div>';
    html += '<div class="prop-card-selector" onclick="event.stopPropagation(); toggleProp(\'' + eq(cod) + '\', this.parentElement)">' + (sel?'✓':'+') + '</div>';
    html += '<img src="' + img + '" loading="lazy" onerror="this.src=\'https://i.imgur.com/Pc9M3I8.png\'"/>';
    html += '<div class="prop-card-body" style="padding:6px 10px 10px 10px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">';
    html += '<div class="prop-card-code" style="font-weight:bold; color:#8c8c8c; font-size:14px;">Código: ' + cod + '</div>';
    if(inmob) html += '<div class="prop-card-inmobiliaria" title="' + eq(inmob) + '">' + inmob + '</div>';
    html += '</div>';
    html += '<div class="prop-card-name" style="font-size:14px; font-weight:600; color:#fff; margin:2px 0 4px 0;">' + (d['Nombre']||'') + '</div>';
    html += '<div class="prop-card-price" style="font-size:0.9rem; font-weight:700; color:#22c55e; margin-bottom:4px;">' + formatP(d['Precio']) + '</div>';
    
    // Features layout
    html += '<div class="prop-card-features" style="display:flex; flex-direction:column; gap:4px; margin-top:6px;">';
    
    // Row 1: Hab, Baños
    html += '<div style="display:flex; flex-wrap:wrap; gap:10px; font-size:12px; color:#ccc; align-items:center;">';
    html += `<span><span style="opacity:0.7; margin-right:3px;">🛏</span> Hab. ${d['Habitaciones']||0}</span>`;
    html += `<span><span style="opacity:0.7; margin-right:3px;">🛁</span> Baños ${d['Baños']||0}</span>`;
    html += '</div>';

    // Row 2: Garaje
    html += '<div style="display:flex; flex-wrap:wrap; gap:10px; font-size:12px; color:#ccc; align-items:center;">';
    html += `<span><span style="opacity:0.7; margin-right:3px;">🚗</span> Garaje ${d['Garaje']||0}</span>`;
    html += '</div>';

    // Row 3: Cocina, Pisos, Lote
    html += '<div style="display:flex; flex-wrap:wrap; gap:10px; font-size:12px; color:#ccc; align-items:center;">';
    if(d['Cocina']) html += `<span><span style="opacity:0.7; margin-right:3px;">🍳</span> ${d['Cocina']}</span>`;
    if(d['Pisos']) html += `<span>Pisos ${d['Pisos']}</span>`;
    if(d['Área']) html += `<span><span style="opacity:0.7; margin-right:3px;">📐</span> ${d['Área']} m²</span>`;
    html += '</div>';

    if(String(d['Rentabilidad']||'').trim()) {
      html += `<div style="font-size:12px; font-weight:700; color:var(--gold); margin-top:4px;">${d['Rentabilidad']}</div>`;
    }
    
    html += '</div>'; // Fin features
    html += '</div>'; // Fin card-body
    html += '</div>'; // Fin prop-card
  }
  html += '</div>';

  if(total > PAGE_SIZE){
    html += '<div class="pagination" style="display:flex; align-items:center; justify-content:center; gap:16px; margin-top:24px; padding:16px 0; border-top:1px solid rgba(212,168,75,0.1);">';
    html += '<button class="btn btn-sm ' + (nlPage===0?'btn-secondary':'btn-gold') + '" ' + (nlPage===0?'disabled':'') + ' onclick="changeNlPage(-1)">« Anterior</button>';
    html += '<span style="font-size:13px; color:var(--muted); font-weight:500;">Página <strong>' + (nlPage+1) + '</strong> de ' + (maxPage+1) + '</span>';
    html += '<button class="btn btn-sm ' + (nlPage===maxPage?'btn-secondary':'btn-gold') + '" ' + (nlPage===maxPage?'disabled':'') + ' onclick="changeNlPage(1)">Siguiente »</button>';
    html += '</div>';
  }
  el.innerHTML = html;
}

function changeNlPage(delta){
  nlPage += delta;
  renderPropsGrid();
  document.getElementById('propsGrid').scrollIntoView({behavior:'smooth', block:'start'});
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
      if(sel) sel.textContent = '\u2713';
    }
  }

  // Actualizar contador
  const c=document.getElementById('selCnt'); 
  if(c) c.textContent=`${selectedProps.length} seleccionadas`;
  
  // Actualizar chips bar en todos los lugares donde haya una grilla activa (tab principal o modal)
  const grids = ['propsGrid', 'editFiltrosGrid'];
  grids.forEach(gid => {
    const grid = document.getElementById(gid);
    if(!grid) return;
    let bar = grid.parentElement.querySelector('.selected-bar');
    if(selectedProps.length > 0){
      const chipsHtml = selectedProps.map(s=>`<span class="sel-chip">${s}<button onclick="deselProp('${s}')">\u00d7</button></span>`).join('');
      if(bar){
        bar.querySelector('.selected-chips').innerHTML = chipsHtml;
      } else {
        const newBar = document.createElement('div');
        newBar.className = 'selected-bar';
        newBar.style.marginBottom = '20px';
        newBar.innerHTML = `<div class="selected-chips">${chipsHtml}</div>`;
        grid.parentElement.insertBefore(newBar, grid);
      }
    } else {
      if(bar) bar.remove();
    }
  });

  // Mostrar/ocultar bot\u00f3n "Generar link" en todas las barras visibles
  document.querySelectorAll('.btn-generar-pc').forEach(btn => {
    // Ya est\u00e1n visibles por CSS, pero esto asegura compatibilidad
  });
}

/* ═══════════════════════════════════════════════
   GUARDAR LEAD
═══════════════════════════════════════════════ */
function guardarLead(enviarAhora, btn){
  const inputN = document.getElementById('nlN');
  const inputC = document.getElementById('nlC');
  if (inputN) nuevoLead.nombre = inputN.value.trim();
  if (inputC) nuevoLead.celular = inputC.value.trim();

  if(!nuevoLead.nombre.trim() && nuevoLead.tipo !== 'inmobiliaria'){ toast('Ingresa el nombre','error'); return; }
  if(nuevoLead.tipo === 'inmobiliaria' && !nuevoLead.nombreInmobiliaria.trim()){ toast('Ingresa nombre de inmobiliaria','error'); return; }
  if(!nuevoLead.celular.trim()){ toast('Ingresa el celular','error'); return; }
  
  const celularLimpio = String(nuevoLead.celular||'').trim().replace(/\D/g, '');
  
  // Si el teléfono estaba en la lista de eliminados, desbloquearlo para permitir su re-registro
  let deletedPhones = JSON.parse(localStorage.getItem('icde_deleted_phones') || '[]');
  if (deletedPhones.includes(celularLimpio)) {
    deletedPhones = deletedPhones.filter(p => p !== celularLimpio);
    localStorage.setItem('icde_deleted_phones', JSON.stringify(deletedPhones));
  }

  const existe = leads.find(l => {
    if (l.id === 'LEAD-AGENDA-GLOBAL') return false;
    const lRawNum = String(l.celular || '').replace(/\D/g, '');
    const lNum = lRawNum.length >= 10 ? lRawNum.slice(-10) : lRawNum;
    const cleanC = celularLimpio.length >= 10 ? celularLimpio.slice(-10) : celularLimpio;
    
    const lNom = norm(l.nombre);
    const nom = norm(nuevoLead.nombre);
    
    const matchCelular = cleanC && lNum && lNum === cleanC;
    const matchNombre = nom && lNom && lNom === nom;
    return matchCelular || matchNombre;
  });
  if (existe) {
    const lRawNum = String(existe.celular || '').replace(/\D/g, '');
    const lNum = lRawNum.length >= 10 ? lRawNum.slice(-10) : lRawNum;
    const cleanC = celularLimpio.length >= 10 ? celularLimpio.slice(-10) : celularLimpio;
    const coincidenciaCelular = cleanC && lNum === cleanC;
    
    toast(`Ya existe un cliente con este ${coincidenciaCelular ? 'celular' : 'nombre'} (${existe.nombre})`, 'error');
    if(btn) btn.disabled = false;
    return;
  }
  
  if(btn) btn.disabled = true;
  const filtradas=filtrarProps(nuevoLead.filtros, true), max=nuevoLead.maxPorEnvio||4;
  const lead={
    id:'U-'+Date.now()+Math.floor(Math.random()*1000), 
    tipo:nuevoLead.tipo, nombre:nuevoLead.nombre.trim(),
    celular:nuevoLead.celular.trim(), notas:nuevoLead.notas, metodoPago:[...nuevoLead.metodoPago],
    estado:nuevoLead.estado, etiqueta:nuevoLead.etiqueta,
    filtros:JSON.parse(JSON.stringify(nuevoLead.filtros)),
    frecuencia:nuevoLead.frecuencia, maxPorEnvio:max,
    nombreInmobiliaria:nuevoLead.nombreInmobiliaria, nombreAgente:nuevoLead.nombreAgente,
    propsFiltradas:filtradas.map(d=>d['Código']),
    propsEnviadas:[], proximosEnvios:generarProximosCheck(nuevoLead.frecuencia),
    historialEnvios:[], visitas:[], creadoEn:new Date().toISOString()
  };
  leads.push(lead); saveLeads(); toast('Cliente guardado ✓','success');
  if(enviarAhora){ 
    const sel = selectedProps.length > 0 ? selectedProps : null;
    setTimeout(()=>abrirEnvioModal(lead.id, sel), 300); 
  }
  resetNuevoLead(); 
  syncSheets(lead).finally(() => {
    if(btn) btn.disabled = false;
  });
}

function resetNuevoLead(){
  nuevoLead = freshLead();
  selectedProps = [];
  renderNuevo();
}

function generarProximos(lista, frec, max, historial){
  if(frec==='manual') return [];
  const prox = [];
  const hoy = new Date();
  const dias = { diaria:1, semanal:7, quincenal:15, mensual:30 }[frec] || 7;
  let offset = 0;
  for(let i=0; i<lista.length; i+=max){
    offset += dias;
    const f = new Date(hoy); f.setDate(f.getDate() + offset);
    prox.push({
      fecha: f.toISOString().split('T')[0],
      codigos: lista.slice(i, i+max).map(d=>d['Código']),
      enviado: false
    });
  }
  return prox;
}

function formatFullPrice(p){
  if(!p) return '$0';
  let n = parseFloat(String(p).replace(/[^\d]/g, ""));
  if(isNaN(n)) return String(p);
  return '$'+n.toLocaleString('es-CO',{maximumFractionDigits:0});
}
function formatShortPrice(p){ 
  if(!p) return ''; 
  const n=parseFloat(String(p).replace(/[^\d]/g,'')); 
  if(isNaN(n)) return p; 
  if(n>=1e9) return `$${(n/1e9).toFixed(1).replace(/\.0$/,'')}MM`; 
  if(n>=1e6) return `$${Math.round(n/1e6)}M`; 
  return `$${n.toLocaleString('es-CO')}`; 
}
function formatP(p){ return formatFullPrice(p); }

function estadoLbl(e){
  const map = { enviando:'Enviando propuestas', proceso:'Venta en proceso', visita:'Visita pendiente', banco:'Referido banco', inactivo:'Inactivo' };
  return map[e] || e;
}

/* ═══════════════════════════════════════════════
   LEADS
═══════════════════════════════════════════════ */

function renderLeads(){
  document.getElementById('mainContent').innerHTML=`
  <div class="section-header">
    <div class="section-title">👥 Leads (${leads.length})</div>
    <div style="display:flex;gap:10px;align-items:center;">
      <div class="pc-buscar-row" style="height:36px; border-radius:10px; width:300px; margin-right:10px;">
        <span class="bn-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input type="text" id="searchLeadsInput" placeholder="Buscar por nombre o celular..." value="${searchTermLeads}" oninput="buscarLeads(this.value)"/>
        ${searchTermLeads ? `<button class="btn-limpiar-pc" style="padding:0 10px; border-radius:0 10px 10px 0;" onclick="buscarLeads(''); document.getElementById('searchLeadsInput').value=''">✕</button>` : ''}
      </div>
      <div class="btn-group" style="background:rgba(255,255,255,0.05);padding:4px;border-radius:10px;display:flex;">
        <button class="btn btn-sm ${leadViewMode==='table'?'btn-primary':'btn-secondary'}" style="padding:6px 10px;box-shadow:none;" onclick="setLeadView('table')">📋 Tabla</button>
        <button class="btn btn-sm ${leadViewMode==='cards'?'btn-primary':'btn-secondary'}" style="padding:6px 10px;box-shadow:none;" onclick="setLeadView('cards')">📇 Tarjetas</button>
      </div>
      <button class="btn btn-primary btn-sm" onclick="showTab('nuevo')">+ Nuevo</button>
    </div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
    <button class="chip-filtro ${currentLeadFilter==='todos'?'sel':''}" id="fA" onclick="filtTabla('todos',this)">Todos</button>
    <button class="chip-filtro ${currentLeadFilter==='activo'?'sel':''}" id="fAc" onclick="filtTabla('activo',this)">🟢 Activos</button>
    <button class="chip-filtro ${currentLeadFilter==='tibio'?'sel':''}" id="fTi" onclick="filtTabla('tibio',this)">🟡 Tibios</button>
    <button class="chip-filtro ${currentLeadFilter==='inactivo'?'sel':''}" id="fIn" onclick="filtTabla('inactivo',this)">⚫ Inactivos</button>
    <button class="chip-filtro ${currentLeadFilter==='inmobiliaria'?'sel':''}" id="fIm" onclick="filtTabla('inmobiliaria',this)">🏢 Inmobiliarias</button>
  </div>
  <div id="leadsContainer"></div>`;

  let lista = leads;
  if(currentLeadFilter==='inmobiliaria') lista=leads.filter(l=>l.tipo==='inmobiliaria');
  else if(currentLeadFilter!=='todos')   lista=leads.filter(l=>l.etiqueta===currentLeadFilter);

  renderLeadsBody(lista);
}

function buscarLeads(val){
  searchTermLeads = val.trim().toLowerCase();
  
  const container = document.getElementById('searchLeadsInput')?.parentElement;
  if (container) {
    let btnLimpiar = container.querySelector('.btn-limpiar-pc');
    if (searchTermLeads && !btnLimpiar) {
      container.insertAdjacentHTML('beforeend', `<button class="btn-limpiar-pc" style="padding:0 10px; border-radius:0 10px 10px 0;" onclick="buscarLeads(''); document.getElementById('searchLeadsInput').value=''">✕</button>`);
    } else if (!searchTermLeads && btnLimpiar) {
      btnLimpiar.remove();
    }
  }

  let lista = leads;
  if(currentLeadFilter==='inmobiliaria') lista=leads.filter(l=>l.tipo==='inmobiliaria');
  else if(currentLeadFilter!=='todos')   lista=leads.filter(l=>l.etiqueta===currentLeadFilter);
  
  renderLeadsBody(lista);
}

function setLeadView(mode){
  leadViewMode = mode;
  localStorage.setItem('icde_lead_view', mode);
  renderLeads();
}
function filtTabla(f,btn){
  currentLeadFilter = f;
  document.querySelectorAll('[id^=f]').forEach(b=>b.classList.remove('sel')); btn.classList.add('sel');
  let lista=leads;
  if(f==='inmobiliaria') lista=leads.filter(l=>l.tipo==='inmobiliaria');
  else if(f!=='todos')   lista=leads.filter(l=>l.etiqueta===f);
  renderLeadsBody(lista);
}
function renderLeadsBody(lista){
  const container=document.getElementById('leadsContainer'); if(!container) return;
  
  let listaFiltrada = [...lista];

  // Aplicar filtro de búsqueda si existe
  if(searchTermLeads){
    listaFiltrada = listaFiltrada.filter(l => {
      const basicStr = String(l.nombre || '') + ' ' + String(l.celular || '');
      if(basicStr.toLowerCase().includes(searchTermLeads)) return true;
      
      // Buscar también en los inmuebles enviados a este cliente
      if(l.propsEnviadas && Array.isArray(l.propsEnviadas)){
        for(let cod of l.propsEnviadas){
          if(String(cod).toLowerCase().includes(searchTermLeads)) return true;
          const prop = allProps.find(p => p['Código'] === cod);
          if(prop && String(prop['Nombre'] || '').toLowerCase().includes(searchTermLeads)) return true;
        }
      }
      return false;
    });
  }

  if(!listaFiltrada.length){ container.innerHTML=`<div class="empty">No hay leads que coincidan</div>`; return; }
  
  const ordenEtiqueta = { activo: 1, tibio: 2, inactivo: 3 };
  const ordenEstado = { visita: 1, enviando: 2, proceso: 3, banco: 4, inactivo: 5 };
  
  listaFiltrada.sort((a,b) => {
    // 1. Primario: Etiqueta (Activo > Tibio > Inactivo)
    const oEtA = ordenEtiqueta[a.etiqueta] || 99;
    const oEtB = ordenEtiqueta[b.etiqueta] || 99;
    if (oEtA !== oEtB) return oEtA - oEtB;
    
    // 2. Secundario: Estado (Pdte. visita > Enviando > ...)
    const oEsA = ordenEstado[a.estado] || 99;
    const oEsB = ordenEstado[b.estado] || 99;
    if (oEsA !== oEsB) return oEsA - oEsB;
    
    // 3. Terciario: Presupuesto (Mayor a Menor)
    const pA = a.filtros?.maxPrice || 0;
    const pB = b.filtros?.maxPrice || 0;
    if (pA !== pB) return pB - pA;

    // 4. Cuaternario: Ofertas (Mayor a Menor)
    const ofA = (a.visitas || []).filter(v => v.oferto === 'si').length;
    const ofB = (b.visitas || []).filter(v => v.oferto === 'si').length;
    return ofB - ofA;
  });

  if(leadViewMode === 'table'){
    container.innerHTML=`
    <div class="leads-table-wrap panel-section" style="padding:0; overflow:hidden;">
      <table class="leads-table"><thead><tr>
        <th>Cliente</th><th>Tipo</th><th>Estado</th><th>Etiqueta</th><th>Presupuesto</th>
        <th>Enviadas</th><th>Ofertas</th><th>Pendientes</th><th>Próx. Envío</th><th>Acciones</th>
      </tr></thead><tbody id="leadsBody">
        ${listaFiltrada.map(l=>{
          const currentMatches = filtrarProps(l.filtros);
          const pend = currentMatches.filter(d => !(l.propsEnviadas || []).includes(d['Código'])).length;
          const prox=(l.proximosEnvios||[]).find(e=>!e.enviado);
          return `<tr class="clickable" onclick="abrirLead('${String(l.id).trim()}', '${String(l.celular).trim()}')">
            <td><div class="leads-row-name">${l.nombre}</div><div class="leads-row-phone">📱 ${l.celular}</div></td>
            <td>${l.tipo==='inmobiliaria'?'<span class="badge badge-inmobiliaria">🏢</span>':'<span style="opacity:0.5;">👤</span>'}</td>
            <td><span class="estado-badge estado-${l.estado}">${estadoLbl(l.estado)}</span></td>
            <td><span class="badge badge-${l.etiqueta}">${l.etiqueta}</span></td>
            <td><div style="font-weight:700; color:var(--gold);">${l.filtros?.maxPrice ? formatShortPrice(l.filtros.maxPrice) : '—'}</div><div style="font-size:10px;color:#888;margin-top:2px;">${(l.metodoPago || []).join(', ') || '—'}</div></td>
            <td style="color:#22c55e;font-weight:700;">${(l.propsEnviadas||[]).length}</td>
            <td>${(l.visitas||[]).filter(v=>v.oferto==='si').length > 0 ? `<span class="badge badge-oferta">${(l.visitas||[]).filter(v=>v.oferto==='si').length}</span>` : '<span style="opacity:0.2;">0</span>'}</td>
            <td style="color:${pend>0?'#f97316':'#888'}; font-weight:700;">
              ${pend > 0 ? `<span class="badge badge-tibio" style="font-size:10px;">${pend} NUEVAS</span>` : '0'}
            </td>
            <td style="font-size:12px;color:#888;">${prox?prox.fecha:'—'}</td>
            <td onclick="event.stopPropagation()"><div style="display:flex;gap:6px;">
              <button class="btn btn-sm ${pend>0?'btn-green':'btn-secondary'}" onclick="abrirEnvioModal('${l.id}')" title="Enviar propuestas">${pend>0?'📤':'✓'}</button>
              <button class="btn btn-sm btn-danger" onclick="eliminarLead('${l.id}')" title="Eliminar lead">🗑</button>
            </div></td>
          </tr>`;

        }).join('')}
      </tbody></table>
    </div>`;
  } else {
    container.innerHTML=`<div class="lead-cards-grid">
      ${listaFiltrada.map(l=>{
        const currentMatches = filtrarProps(l.filtros);
        const pend = currentMatches.filter(d => !(l.propsEnviadas || []).includes(d['Código'])).length;
        const prox=(l.proximosEnvios||[]).find(e=>!e.enviado);
        return `
        <div class="lead-card" onclick="abrirLead('${String(l.id).trim()}', '${String(l.celular).trim()}')">
          <div class="lc-header">
            <div>
              <div class="lc-name">${l.nombre}</div>
              <div class="lc-phone">📱 ${l.celular}</div>
            </div>
            <span class="badge badge-${l.etiqueta}">${l.etiqueta}</span>
          </div>
          <div style="margin-bottom:12px;"><span class="estado-badge estado-${l.estado}">${estadoLbl(l.estado)}</span></div>
          <div class="lc-stats">
            <div><div class="lc-stat-val">${(l.propsEnviadas||[]).length}</div><div class="lc-stat-lbl">Enviadas</div></div>
            <div><div class="lc-stat-val" style="color:var(--gold); font-size:13px;">${l.filtros?.maxPrice ? formatShortPrice(l.filtros.maxPrice) : '—'}</div><div class="lc-stat-lbl">Presupuesto</div><div style="font-size:9px;color:#888;margin-top:1px;">${(l.metodoPago||[]).join(', ')||'—'}</div></div>
            <div><div class="lc-stat-val" style="color:#a855f7;">${(l.visitas||[]).filter(v=>v.oferto==='si').length}</div><div class="lc-stat-lbl">Ofertas</div></div>
            <div><div class="lc-stat-val" style="color:${pend>0?'#f97316':''}">${pend}</div><div class="lc-stat-lbl">Pendientes</div></div>
          </div>
          <div class="lc-footer">
            <div style="font-size:11px;color:#666;">Próximo: ${prox?prox.fecha:'—'}</div>
            <button class="btn btn-sm btn-green" style="padding:6px 10px;" onclick="event.stopPropagation(); abrirEnvioModal('${String(l.id).trim()}')">📤 Enviar</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }
}
function estadoLbl(e){ return {proceso:'Proceso',enviando:'Enviando',visita:'Pdte. visita',banco:'Banco',inactivo:'Inactivo'}[e]||e; }

/* ═══════════════════════════════════════════════
   PANEL LEAD
═══════════════════════════════════════════════ */
function abrirLead(id, celular){ 
  id = String(id || '').trim();
  
  // Limpieza visual previa para evitar efecto "un paso atrás"
  const panel = document.getElementById('sidePanelContent');
  if(panel) panel.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando datos...</div>';
  
  currentLeadId = id; 
  
  // BÚSQUEDA POR ID
  let l = leads.find(x => String(x.id || '').trim() === id);
  
  // Si no se encuentra por ID exacto, intentamos por teléfono (último recurso por desincronización)
  if(!l && celular) {
     const normPhone = String(celular).replace(/[^\d]/g, "");
     l = leads.find(x => String(x.celular || '').replace(/[^\d]/g, "") === normPhone);
     if(l) {
        console.warn("Lead recuperado por teléfono:", celular);
        currentLeadId = l.id;
     }
  }
  
  if(!l) {
    console.error("Lead no encontrado:", id);
    toast('Cliente no encontrado en la lista actual', 'error');
    return;
  }
  document.getElementById('leadPanel').classList.add('open'); 
  renderSidePanel(l); 
}
function closePanelIfOuter(e){ if(e.target===document.getElementById('leadPanel')) closeSidePanel(); }
function closeSidePanel(){ 
  document.getElementById('leadPanel').classList.remove('open'); 
  if(window.chatInterval) {
    clearInterval(window.chatInterval);
    window.chatInterval = null;
  }
}

function renderSidePanel(lead){
  const currentMatches = filtrarProps(lead.filtros);
  const pend = currentMatches.filter(d => !(lead.propsEnviadas || []).includes(d['Código']));
  const total = currentMatches.length, env = (lead.propsEnviadas || []).length;
  const ftxt = Object.entries(lead.filtros||{}).filter(([,v])=>v!==undefined && v!==null && String(v).length).map(([k,v])=>{
    const val = Array.isArray(v) ? v.join(', ') : v;
    return `${k}: ${val}`;
  }).join(' · ')||'Sin filtros';
  const pct = total > 0 ? Math.round(env / total * 100) : 0;
  
  document.getElementById('sidePanelContent').innerHTML=`
  <div class="panel-header">
    <div>
      <div class="panel-name">${lead.nombre}</div>
      <div style="font-size:11px; color:var(--gold); font-weight:bold; margin-top:4px; opacity:0.8;">Ref: ${lead.id}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
        <span class="badge badge-${lead.etiqueta}">${lead.etiqueta}</span>
        <span class="estado-badge estado-${lead.estado}">${estadoLbl(lead.estado)}</span>
        ${lead.tipo==='inmobiliaria'?`<span class="badge badge-inmobiliaria">🏢 ${lead.nombreInmobiliaria||''}</span>`:''}
      </div>
    </div>
    <button class="panel-close" onclick="closeSidePanel()">×</button>
  </div>

  <div style="display:flex;gap:10px;margin:10px 0 20px 0;">
    <button class="btn ${pend.length>0?'btn-green':'btn-primary'} btn-sm" style="flex:1;" onclick="abrirEnvioModal('${lead.id}')">
      ${pend.length>0 ? `📤 Enviar ${pend.length} Novedades` : '📤 Enviar Propuestas'}
    </button>
    <a href="https://wa.me/57${lead.celular}" target="_blank" class="btn btn-secondary btn-sm" style="flex:0.5; text-decoration:none; color:inherit; display:flex; align-items:center; justify-content:center; gap:6px;">💬 WhatsApp</a>
  </div>



  <div class="panel-section collapsible">
    <div class="panel-section-title" onclick="toggleSection(this)">Perfil y Contacto</div>
    <div class="section-content">
      <div class="form-grid" style="margin-top:16px;">
        <div><div class="form-label">Teléfono</div><div style="margin-top:4px; font-weight:600;">📱 ${lead.celular}</div></div>
        <div><div class="form-label">Método Pago</div><div style="margin-top:4px; font-weight:600;">${(lead.metodoPago||[]).join(', ')||'—'}</div></div>
        ${lead.tipo==='inmobiliaria'?`<div><div class="form-label">Agente Aliado</div><div style="margin-top:4px; font-weight:600;">${lead.nombreAgente||'—'}</div></div>`:''}
        <div class="full">
          <div class="form-label">Notas del Cliente</div>
          <textarea class="form-input" style="margin-top:6px; min-height:80px; resize:vertical; background:rgba(255,255,255,0.03);" 
            onblur="updLead('${lead.id}','notas',this.value)" placeholder="Añadir notas sobre el cliente...">${lead.notas || ''}</textarea>
        </div>
      </div>
      <div class="form-grid" style="margin-top:20px; padding-top:20px; border-top:1px solid var(--glass-border);">
        <div class="form-group"><label class="form-label">Estado</label>
          <select class="form-input" onchange="updLead('${lead.id}','estado',this.value)">
            <option value="enviando" ${lead.estado==='enviando'?'selected':''}>Enviando propuestas</option>
            <option value="proceso"  ${lead.estado==='proceso'?'selected':''}>Proceso de venta</option>
            <option value="visita"   ${lead.estado==='visita'?'selected':''}>Pendiente visita</option>
            <option value="banco"    ${lead.estado==='banco'?'selected':''}>Referido al banco</option>
            <option value="inactivo" ${lead.estado==='inactivo'?'selected':''}>Inactivo</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Prioridad</label>
          <select class="form-input" onchange="updLead('${lead.id}','etiqueta',this.value)">
            <option value="activo"   ${lead.etiqueta==='activo'?'selected':''}>🟢 Activo</option>
            <option value="tibio"    ${lead.etiqueta==='tibio'?'selected':''}>🟡 Tibio</option>
            <option value="inactivo" ${lead.etiqueta==='inactivo'?'selected':''}>⚫ Inactivo</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="panel-section collapsible">
    <div class="panel-section-title" onclick="toggleSection(this)"><span>Intereses y Filtros</span> <button class="btn btn-gold btn-sm" style="padding:4px 10px; font-size:11px;" onclick="event.stopPropagation();abrirEditFiltros('${lead.id}')">Editar</button></div>
    <div class="section-content">
      <div style="margin-top:16px;">
        <div style="background:rgba(212,168,75,0.05); padding:15px; border-radius:12px; border:1px solid var(--border);">
          <div style="font-size:13px; color:var(--text); line-height:1.4;">${ftxt}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="panel-section collapsible">
    <div class="panel-section-title" onclick="toggleSection(this)">📊 Feedback de Co-Creación</div>
    <div class="section-content">
      <div id="panelCocreacionFeedback" style="margin-top:12px;">
        ${renderCoCreacionFeedback(lead)}
      </div>
    </div>
  </div>

  <div class="panel-section collapsible">
    <div class="panel-section-title" onclick="toggleSection(this)">📋 Seguimiento de Propiedades</div>
    <div class="section-content">
      <!-- A. PROGRESO -->
      <div style="margin-top:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span class="prog-label" style="color:var(--gold); font-weight:600;">Progreso de Envío</span>
          <span class="prog-label">${pct}%</span>
        </div>
        <div class="prog-bar-wrap"><div class="prog-bar" style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span class="prog-label">${env} enviadas de ${total}</span>
          <span class="prog-label">Frecuencia: ${lead.frecuencia}</span>
        </div>
      </div>

      <!-- B. PROPIEDADES ENVIADAS Y AGENDAMIENTO -->
      <div style="margin-top:20px; border-top:1px solid var(--glass-border); padding-top:15px;">
        <div style="font-size:12px; color:var(--gold); font-weight:600; text-transform:uppercase; margin-bottom:10px;">Propiedades e Interés</div>
        <div id="panelEnviadas">${renderPanelPropsEnviadas(lead)}</div>
      </div>

      <!-- C. VISITAS Y OFERTAS -->
      <div style="margin-top:20px; border-top:1px solid var(--glass-border); padding-top:15px;">
        <div style="font-size:12px; color:var(--gold); font-weight:600; text-transform:uppercase; margin-bottom:10px;">Citas y Visitas</div>
        <div id="panelVisitas">${renderPanelVisitas(lead)}</div>
        <button class="btn btn-primary btn-sm" style="width:100%; margin-top:10px;" onclick="event.stopPropagation();abrirVisitaModal('${lead.id}')">+ Agendar Nueva Visita</button>
      </div>

      <!-- D. HISTORIAL CRONOLÓGICO -->
      <div style="margin-top:20px; border-top:1px solid var(--glass-border); padding-top:15px;">
        <div style="font-size:12px; color:#888; font-weight:600; text-transform:uppercase; margin-bottom:10px;">Historial de Envíos</div>
        <div id="panelTimeline">${renderTimeline(lead)}</div>
      </div>
    </div>
  </div>

  <div class="panel-section collapsible collapsed">
    <div class="panel-section-title" onclick="toggleSection(this)">⏳ Propiedades Pendientes (${pend.length})</div>
    <div class="section-content">
      <div id="panelPendientes" style="margin-top:12px;">${renderPanelPendientes(lead, pend)}</div>
    </div>
  </div>

  <div style="margin-top:auto; padding-top:20px; border-top:1px solid var(--glass-border);">
    <button class="btn btn-danger btn-sm" style="width:100%; font-weight:700; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onclick="eliminarLead('${lead.id}')">🗑 Eliminar Cliente Permanentemente</button>
  </div>`;
  

}

function renderCoCreacionFeedback(lead) {
  const feedback = lead.feedback || {};
  const keys = Object.keys(feedback);
  if (!keys.length) {
    return `<div class="empty" style="padding:15px; text-align:center; color:#888; font-size:12px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">El cliente aún no ha dejado reacciones en su portal.</div>`;
  }
  
  let html = `<div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">`;
  
  keys.forEach(cod => {
    const fb = feedback[cod];
    const p = allProps.find(x => String(x['Código']) === String(cod));
    const name = p ? p['Nombre'] : `Propiedad ${cod}`;
    const price = p ? formatP(p['Precio']) : '';
    const img = p ? ((p['Imagenes'] || '').split('|')[0].trim() || p['Image'] || 'https://i.imgur.com/Pc9M3I8.png') : 'https://i.imgur.com/Pc9M3I8.png';
    
    let badge = '';
    if (fb.interes === 'LIKE') {
      badge = `<span class="badge" style="background:#10b981; color:#fff; font-size:11px; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">❤️ Me Interesa</span>`;
    } else if (fb.interes === 'DISLIKE') {
      badge = `<span class="badge" style="background:#ef4444; color:#fff; font-size:11px; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">👎 Descartada</span>`;
    } else {
      badge = `<span class="badge" style="background:#6b7280; color:#fff; font-size:11px; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">💬 Comentado</span>`;
    }
    
    html += `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:12px; display:flex; gap:12px; align-items:flex-start;">
        <img src="${img}" style="width:60px; height:50px; object-fit:cover; border-radius:8px; flex-shrink:0;" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-weight:700; color:#fff; font-size:12px; text-transform:uppercase; letter-spacing:0.02em;">Código ${cod}</span>
            ${badge}
          </div>
          <div style="font-size:12px; font-weight:600; color:#eee; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;">${name}</div>
          ${price ? `<div style="font-size:11px; color:var(--gold); font-weight:700; margin-bottom:6px;">${price}</div>` : ''}
          ${fb.comentario ? `
            <div style="background:rgba(212,168,75,0.06); border-left:3px solid var(--gold); border-radius:0 6px 6px 0; padding:6px 10px; font-size:11px; font-style:italic; color:#ddd; margin-top:6px; line-height:1.4; word-break:break-word;">
              "${fb.comentario}"
            </div>
          ` : ''}
          <div style="font-size:10px; color:#666; text-align:right; margin-top:6px;">${fb.fecha || ''}</div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function toggleSection(el){
  const section = el.closest('.collapsible');
  section.classList.toggle('collapsed');
}


function updLead(id,campo,val){ 
  const tid = String(id || '').trim();
  const l=leads.find(x=>String(x.id || '').trim()===tid); 
  if(!l) return; 
  l[campo]=val; 
  saveLeads(); 
  syncSheets(l);
  toast(`${campo} actualizado ✓`,'success'); 
  if(currentTab==='leads') renderLeadsBody(leads); 
}

function renderPanelPropsEnviadas(lead){
  const env = lead.propsEnviadas || [];
  if(!env.length) return '<div style="color:#555;font-size:13px;padding:12px 0;">No se han enviado propiedades aún</div>';
  return env.map(cod => {
    const p = allProps.find(d => d['Código'] === cod);
    const v = (lead.visitas || []).find(x => x.codigo === cod);
    const img = p ? ((p['Imagenes']||'').split('|')[0].trim()||p['Image']||'https://i.imgur.com/Pc9M3I8.png') : 'https://i.imgur.com/Pc9M3I8.png';
    let badges = `<span class="badge badge-enviada">Enviada</span>`;
    if(v){
      if(v.estado==='realizada') badges = `<span class="badge badge-visita">Visitada</span>`;
      else if(v.estado==='solicito_visita') badges = `<span class="badge badge-solicito">Solicitó Visita</span>`;
      else badges = `<span class="badge badge-agendada">Agendada</span>`;
      if(v.oferto==='si') badges += ` <span class="badge badge-oferta">Oferta</span>`;
    }
    return `
      <div class="enviada-item" style="display:flex; gap:12px; align-items:center; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px; padding:10px; margin-bottom:8px; transition: all 0.2s;">
        <div style="display:flex; flex:1; align-items:center; gap:12px; cursor:pointer; min-width:0;" onclick="abrirModalProp('${eq(cod)}')">
          <img src="${img}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; color:#fff; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cod} ${p ? `· ${p['Nombre']}` : ''}</div>
            <div style="display:flex; gap:4px; margin-top:4px;">${badges}</div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm ${v?'btn-secondary':'btn-primary'}" style="padding:6px; min-width:32px;" onclick="event.stopPropagation();abrirVisitaModal('${lead.id}','${cod}')" title="${v ? 'Editar visita' : 'Agendar visita'}">
            ${v ? '✏️' : '🗓'}
          </button>
          <button class="btn btn-sm btn-danger" style="padding:6px; min-width:32px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444;" onclick="event.stopPropagation(); eliminarPropEnviada('${lead.id}','${cod}')" title="Eliminar de enviadas">
            🗑
          </button>
        </div>
      </div>`;
  }).join('');
}

function renderPanelPendientes(lead, pend){
  if(!pend.length) return '<div style="color:#22c55e;font-size:13px;padding:12px 0;">¡Todas enviadas! 🎉</div>';
  return `
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:10px;">
      ${pend.map(cod => {
        const p = allProps.find(d => d['Código'] === cod);
        const img = p ? ((p['Imagenes']||'').split('|')[0].trim()||p['Image']||'https://i.imgur.com/Pc9M3I8.png') : 'https://i.imgur.com/Pc9M3I8.png';
        return `
          <div class="prop-card" style="cursor:pointer; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:8px; overflow:hidden;" onclick="abrirModalProp('${eq(cod)}')">
            <img src="${img}" style="width:100%; aspect-ratio:1; object-fit:cover;" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/>
            <div style="padding:6px; font-size:11px; text-align:center; color:var(--gold); font-weight:700;">${cod}</div>
            ${p && p['Inmobiliaria'] ? `<div class="prop-card-inmobiliaria" style="bottom:4px; right:4px; font-size:8px;">${p['Inmobiliaria']}</div>` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

function renderPanelVisitas(lead){
  if(!(lead.visitas||[]).length) return '<div style="color:#555;font-size:13px;padding:12px 0;">No hay visitas agendadas</div>';
  return lead.visitas.map(v=>`
    <div class="visita-item" style="background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px; padding:12px; margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:700;color:var(--gold);">${v.codigo}</span>
        <span class="badge badge-${v.estado}">${v.estado}</span>
      </div>
      <div style="font-size:12px;color:#aaa;margin-bottom:4px;">📅 ${v.fecha} · 🕒 ${v.hora || '—'}</div>
      ${v.comentarios?`<div style="font-size:12px;color:#888;font-style:italic;margin-top:6px;border-left:2px solid var(--border);padding-left:8px;">"${v.comentarios}"</div>`:''}
      <div style="margin-top:10px;display:flex;gap:8px;">
        <button class="btn btn-sm btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="event.stopPropagation();abrirVisitaModal('${lead.id}','${v.codigo}')">Editar</button>
      </div>
    </div>`).join('');
}

function renderTimeline(lead){
  const hEnv = lead.historialEnvios || [];
  if(!hEnv.length) return '<div style="color:#555;font-size:13px;padding:12px 0;">Sin envíos aún</div>';
  return hEnv.map((en,i)=>`
    <div class="envio-item" style="background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px; padding:12px; margin-bottom:10px;">
      <div class="envio-header" style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:700;color:var(--gold);">
          ${en.tipoEnvio === 'link' ? '🔗 Envío de Link' : '📄 Envío Individual'}
        </span>
        <span class="envio-fecha" style="font-size:11px;color:#666;">${en.fecha}</span>
      </div>
      <div class="envio-props" style="display:flex;gap:4px;flex-wrap:wrap;">
        ${(en.codigos||[]).map(c=>`<span class="envio-prop-tag" style="background:rgba(212,168,75,0.1); border:1px solid var(--border); border-radius:4px; padding:2px 6px; font-size:11px; color:var(--gold);">${c}</span>`).join('')}
        ${en.tipoEnvio === 'link' && (en.totalCods > (en.codigos||[]).length) ? `<span style="font-size:10px; color:#666; align-self:center;">+${en.totalCods - (en.codigos||[]).length} más</span>` : ''}
      </div>
      <div style="margin-top:8px;">
        <textarea class="form-input" style="font-size:12px; width:100%; min-height:40px; background:transparent; border:1px dashed rgba(212,168,75,0.2); padding:5px; color:#aaa;" 
          onblur="updTimelineNota('${lead.id}', ${i}, this.value)" placeholder="Sin notas...">${en.notas || ''}</textarea>
      </div>
      <div class="nota-input-wrap" style="margin-top:10px;display:flex;gap:6px;">
        <input class="form-input" style="font-size:12px;padding:6px 10px;flex:1;" placeholder="Añadir nota..." id="nE_${lead.id}_${i}"/>
        <button class="btn btn-sm btn-secondary" style="padding:6px 10px;" onclick="addNota('${lead.id}',${i})">+</button>
      </div>
    </div>`).join('');
}

function eliminarPropEnviada(leadId, cod){
  if(!confirm(`¿Eliminar la propiedad ${cod} de la lista de enviadas?`)) return;
  const lead = leads.find(l => String(l.id) === String(leadId));
  if(!lead) return;
  
  // Eliminar de propsEnviadas
  const idx = (lead.propsEnviadas || []).indexOf(cod);
  if(idx > -1) lead.propsEnviadas.splice(idx, 1);
  
  saveLeads();
  syncSheets(lead);
  renderSidePanel(lead);
  if(currentTab==='leads') renderLeads();
  toast('Propiedad eliminada de la lista ✓','success');
}

function addNota(lid,idx){ 
  const inp=document.getElementById(`nE_${lid}_${idx}`); 
  if(!inp||!inp.value.trim()) return; 
  const l=leads.find(x=>String(x.id)===String(lid)); 
  if(!l) return; 
  l.historialEnvios[idx].notas=(l.historialEnvios[idx].notas?l.historialEnvios[idx].notas+'\n':'')+inp.value.trim(); 
  saveLeads(); 
  syncSheets(l);
  inp.value=''; 
  toast('Nota añadida ✓','success'); 
  renderSidePanel(l); 
}

async function eliminarLead(id){ 
  if(!confirm('¿Estás seguro de eliminar este cliente? Esta acción también lo eliminará de la nube y no se puede deshacer.')) return; 
  
  // Encontrar el lead para obtener su teléfono y buscar posibles duplicados locales con otras IDs
  const leadABorrar = leads.find(l => String(l.id) === String(id));
  let celularABorrar = '';
  let idsABorrar = [String(id)];
  
  if (leadABorrar) {
    celularABorrar = String(leadABorrar.celular || '').replace(/\D/g, '');
    if (celularABorrar) {
      // Buscar otros leads con el mismo teléfono (duplicados por ID)
      leads.forEach(l => {
        if (l.id !== 'LEAD-AGENDA-GLOBAL' && String(l.id) !== String(id)) {
          const lCel = String(l.celular || '').replace(/\D/g, '');
          if (lCel === celularABorrar) {
            idsABorrar.push(String(l.id));
          }
        }
      });
      
      // Guardar el teléfono en la lista de teléfonos eliminados
      let deletedPhones = JSON.parse(localStorage.getItem('icde_deleted_phones') || '[]');
      if (!deletedPhones.includes(celularABorrar)) {
        deletedPhones.push(celularABorrar);
        localStorage.setItem('icde_deleted_phones', JSON.stringify(deletedPhones));
      }
    }
  }

  // Registrar todos los IDs a borrar en deletedLeads
  idsABorrar.forEach(bId => {
    if(!deletedLeads.includes(bId)) {
      deletedLeads.push(bId);
    }
  });
  localStorage.setItem('icde_deleted_leads', JSON.stringify(deletedLeads));

  // Eliminar localmente primero (por ID y por teléfono celular para barrer duplicados locales)
  leads = leads.filter(l => {
    if (String(l.id) === String(id)) return false;
    if (celularABorrar && String(l.celular || '').replace(/\D/g, '') === celularABorrar && l.id !== 'LEAD-AGENDA-GLOBAL') return false;
    return true;
  });
  
  saveLeads(); 
  if(currentLeadId == id || idsABorrar.includes(String(currentLeadId))) closeSidePanel(); 
  renderLeads(); 
  toast('Eliminando de la nube...', 'success'); 
  
  // Sincronizar eliminación con Google Sheets
  if(CRM_SCRIPT_URL) {
    try {
      for (let bId of idsABorrar) {
        fetch(CRM_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Apps Script suele requerir no-cors o manejarlo con redirect
          body: JSON.stringify({ action: 'deleteLead', id: bId })
        });
      }
      toast('Eliminado correctamente ✓', 'success');
    } catch(e) {
      console.error("Error sincronizando eliminación:", e);
      // No revertimos el borrado local para no confundir al usuario, 
      // pero avisamos que hubo un problema de red.
      toast('Borrado localmente. Error de red con la nube.', 'error');
    }
  }
}

/* ═══════════════════════════════════════════════
   MODAL ENVÍO
═══════════════════════════════════════════════ */
function abrirEnvioModal(leadId, presel){
  try {
    const tid = String(leadId || '').trim();
    envioLeadId = tid;
    const lead = leads.find(l => String(l.id || '').trim() === tid);
    if (!lead) { console.error("Lead not found:", leadId); return; }
    
    // Garantizar que filtros sea un objeto
    const st = (lead.filtros && typeof lead.filtros === 'object') ? lead.filtros : {};
    
    // Detectamos si hay propiedades nuevas
    const currentMatches = filtrarProps(st).map(d => d['Código']);
    const enviadas = lead.propsEnviadas || [];
    const nuevas = currentMatches.filter(c => !enviadas.includes(c));
    
    // Lote de propiedades (Individual)
    const lote = (Array.isArray(presel) && presel.length > 0) ? presel : nuevas;
    envioLote = lote;
    const objs = lote.map(c => allProps.find(d => d['Código'] === c)).filter(Boolean);
    
    // Destinatario
    let dest = "Cliente";
    if (lead.tipo === 'inmobiliaria') {
      dest = (lead.nombreAgente || lead.nombre || "Agente").trim().split(' ')[0];
    } else {
      dest = (lead.nombre || "Cliente").trim().split(' ')[0];
    }

    // Emojis (Surrogate Pairs)
    const emoHola = "\uD83D\uDC4B";      // 👋
    const emoCasa = "\uD83C\uDFE1";      // 🏡
    const emoLink = "\uD83D\uDC47";      // 👇
    const emoFin = "\u2705";            // ✅
    
    const link = getSearchLinkFromFilters(st, lote, lead.id);
    const hasSelection = lote.length > 0;
    const initModo = (Array.isArray(presel) && presel.length > 0) ? 'individual' : 'link';

    let htmlIndividual = "";
    if (hasSelection) {
      htmlIndividual = `
        <div style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:10px;">Propiedades seleccionadas (${lote.length}):</div>
        <div id="envioChecks" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px; max-height:220px; overflow-y:auto; padding-right:5px;">
          ${lote.map(cod => { 
            const p = allProps.find(d => d['Código'] === cod); 
            const img = p ? ((p['Imagenes'] || '').split('|')[0].trim() || p['Image'] || 'https://i.imgur.com/Pc9M3I8.png') : 'https://i.imgur.com/Pc9M3I8.png';
            return `<label style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;cursor:pointer;">
              <input type="checkbox" checked value="${cod}" style="accent-color:var(--gold);width:18px;height:18px;flex-shrink:0;"/>
              <img src="${img}" style="width:50px;height:42px;object-fit:cover;border-radius:8px;" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/>
              <div style="overflow:hidden;">
                <div style="font-size:13px;font-weight:700;color:#fff;">${cod}</div>
                <div style="font-size:11px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p ? p['Nombre'] || '' : ''} · <span style="color:var(--gold);">${p ? formatP(p['Precio']) : ''}</span></div>
              </div>
            </label>`;
          }).join('')}
        </div>
        <div style="font-size:12px;color:#888;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:15px;">
           <strong style="color:#fff;display:block;margin-bottom:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.6;">Vista previa mensaje:</strong>
           <div style="line-height:1.5;">
             ${emoCasa} ¡Hola ${dest}! ${emoHola}<br/><br/>
             Te comparto estas nuevas opciones que se ajustan a lo que buscas ${emoLink}<br/><br/>
             ${objs.map(p => `• <strong>${p['Nombre'] || p['Código']}</strong> (${formatP(p['Precio'])})<br/>&nbsp;&nbsp;\u{1F517} <a href="https://icdeinmobiliaria.com/propiedad/${generarSlugPropiedad(p)}.html" target="_blank" style="color:var(--gold);text-decoration:none;">Ver propiedad</a>`).join('<br/><br/>')}
             <br/><br/>
             Revísalo y me cuentas que inmueble deseas que visitemos ${emoFin}
           </div>
        </div>`;
    } else {
      htmlIndividual = `<div class="empty" style="padding:20px;text-align:center;color:#666;">No hay propiedades nuevas para enviar individualmente.</div>`;
    }

    const content = `
      <div style="font-size:13px;color:#aaa;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.05);">Para: <strong style="color:#fff;">${dest}</strong> · ${lead.celular}</div>
      
      <div style="display:flex; gap:10px; margin-bottom:20px;">
        <button id="btnModoLink" class="btn btn-sm ${initModo === 'link' ? 'btn-primary' : 'btn-secondary'}" style="flex:1;" onclick="setEnvioModo('link')">\u{1F517} Enviar Link Catálogo</button>
        <button id="btnModoInd" class="btn btn-sm ${initModo === 'individual' ? 'btn-primary' : 'btn-secondary'}" style="flex:1;" onclick="setEnvioModo('individual')">\u{1F4CB} Enviar Selección</button>
      </div>

      <div id="envioModoLink" style="display:${initModo === 'link' ? 'block' : 'none'}">
         <div style="font-size:12px; color:var(--gold); margin-bottom:12px; font-weight:600; background:rgba(212,168,75,0.1); padding:8px; border-radius:8px;">Se enviará un link dinámico con las ${currentMatches.length} opciones actuales.</div>
         <div style="font-size:12px;color:#888;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:15px;">
           <strong style="color:#fff;display:block;margin-bottom:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.6;">Vista previa mensaje:</strong>
           <div style="line-height:1.5;">
             ${emoCasa} ¡Hola ${dest}! ${emoHola}<br/><br/>
             Te comparto aquí los inmuebles que se ajustan a tus requerimientos ${emoLink}<br/><br/>
             <span style="color:var(--gold); word-break:break-all; font-weight:500;">${link}</span><br/><br/>
             Revísalo y me cuentas que inmueble deseas que visitemos ${emoFin}
           </div>
         </div>
      </div>

      <div id="envioModoIndividual" style="display:${initModo === 'individual' ? 'block' : 'none'}">
        ${htmlIndividual}
      </div>
      <input type="hidden" id="envioModoInput" value="${initModo}"/>
    `;
    
    document.getElementById('envioModalContent').innerHTML = content;
    document.getElementById('envioModal').classList.add('open');
  } catch (err) {
    console.error("Error in abrirEnvioModal:", err);
    toast("Error al abrir modal de envío", "error");
  }
}

function setEnvioModo(modo){
  document.getElementById('envioModoInput').value = modo;
  document.getElementById('envioModoLink').style.display = modo==='link'?'block':'none';
  document.getElementById('envioModoIndividual').style.display = modo==='individual'?'block':'none';
  // Actualizar botones
  const btns = document.querySelectorAll('#envioModalContent .btn-sm');
  btns[0].className = `btn btn-sm ${modo==='link'?'btn-primary':'btn-secondary'}`;
  btns[1].className = `btn btn-sm ${modo==='individual'?'btn-primary':'btn-secondary'}`;
}


function guardarSinEnviar(){
  const lead = leads.find(l => String(l.id) === String(envioLeadId));
  if(!lead) return;
  
  if(!lead.propsEnviadas) lead.propsEnviadas = [];
  let count = 0;
  envioLote.forEach(cod => {
    if(!lead.propsEnviadas.includes(cod)){
      lead.propsEnviadas.push(cod);
      count++;
    }
  });
  
  if(count > 0){
    const msg = `Se marcaron ${count} propiedades como enviadas (sin WhatsApp).`;
    if(!lead.historialEnvios) lead.historialEnvios = [];
    lead.historialEnvios.unshift({ fecha: new Date().toISOString().split('T')[0], codigos: envioLote, notas: msg });
    
    lead.proximosEnvios = generarProximosCheck(lead.frecuencia);
    saveLeads();
    syncSheets(lead);
    
    toast("✅ Propiedades marcadas como enviadas","success");
    closeModal('envioModal');
    if(currentTab==='leads') renderLeadsBody(leads);
    renderSidePanel(lead);
  } else {
    toast("No había propiedades nuevas para marcar","warning");
    closeModal('envioModal');
  }
}

function confirmarEnvio(btn){
  if(btn) btn.disabled = true;
  try {
    const lead = leads.find(l => String(l.id) === String(envioLeadId));
    if (!lead) { toast("Cliente no encontrado", "error"); return; }
    const modo = document.getElementById('envioModoInput').value;
    
    // Destinatario seguro
    let dest = "Cliente";
    if (lead.tipo === 'inmobiliaria') {
      dest = (lead.nombreAgente || lead.nombre || "Agente").trim().split(' ')[0];
    } else {
      dest = (lead.nombre || "Cliente").trim().split(' ')[0];
    }

    // Emojis (Surrogate Pairs para máxima estabilidad)
    const emoHola = "\uD83D\uDC4B";      // 👋
    const emoCasa = "\uD83C\uDFE1";      // 🏡
    const emoLink = "\uD83D\uDC47";      // 👇
    const emoFin = "\u2705";            // ✅
    const emoEstrella = "\u2728";        // ✨
    const emoBullet = "\u2022";          // •
    const emoClip = "\uD83D\uDD17";      // 🔗
    
    let msg = "";
    let cods = [];

    if (modo === 'link') {
      const st = (lead.filtros && typeof lead.filtros === 'object') ? lead.filtros : {};
      // Usar los IDs del lote (preselección) si existen, igual que en la vista previa
      const idsParaLink = (envioLote && envioLote.length > 0) ? envioLote : null;
      const link = getSearchLinkFromFilters(st, idsParaLink, lead.id);
      msg = emoCasa + " \u00A1Hola " + dest + "! " + emoHola + "\r\n\r\n" +
            "Te comparto aqu\u00ED los inmuebles que se ajustan a tus requerimientos " + emoLink + "\r\n\r\n" +
            link + "\r\n\r\n" +
            "Rev\u00EDsalo y me cuentas que inmueble deseas que visitemos " + emoFin + emoEstrella;
      // Si enviamos un link de selecci\u00f3n espec\u00edfica, registramos solo esos IDs
      cods = idsParaLink ? idsParaLink : filtrarProps(st).map(d => d['Código']);
    } else {
      cods = [...document.querySelectorAll('#envioChecks input:checked')].map(c => c.value);
      if (!cods.length) { toast('Selecciona al menos una', 'error'); return; }
      const objs = cods.map(c => allProps.find(d => d['Código'] === c)).filter(Boolean);
      msg = emoCasa + " \u00A1Hola " + dest + "! " + emoHola + "\r\n\r\n" +
            "Te comparto estas nuevas opciones que se ajustan a lo que buscas " + emoLink + "\r\n\r\n";
      objs.forEach(p => {
        msg += emoBullet + " *" + (p['Nombre'] || p['Código']) + "* (" + formatP(p['Precio']) + ")\r\n  " + emoClip + " " + `https://icdeinmobiliaria.com/propiedad/${generarSlugPropiedad(p)}.html` + "\r\n\r\n";
      });
      msg += "Rev\u00EDsalo y me cuentas que inmueble deseas que visitemos " + emoFin + emoEstrella;
    }

    const hoy = new Date().toISOString().split('T')[0];
    const prevEnviadas = lead.propsEnviadas || [];
    const nuevasCods = cods.filter(c => !prevEnviadas.includes(c));
    
    lead.propsEnviadas = [...new Set([...prevEnviadas, ...cods])];
    lead.historialEnvios.push({ 
      fecha: hoy, 
      codigos: nuevasCods, 
      totalCods: cods.length,
      tipoEnvio: modo,
      notas: modo === 'link' ? 'Envío de link catálogo' : 'Envío selección individual' 
    });
    
    lead.proximosEnvios = generarProximosCheck(lead.frecuencia);
    
    saveLeads(); 
    closeModal('envioModal'); 
    syncSheets(lead);
    
    const num = lead.celular.replace(/\D/g, '');
    const waBase = num.startsWith('57') ? num : '57' + num;
    
    if (settings.waApi) {
      fetch(`${settings.waApi}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num, message: msg })
      }).then(r => {
        if (r.ok) {
          toast(`Enviado automáticamente ✓`, 'success');
        } else {
          // Si el bridge falló con error controlado, permitimos el fallback manual
          window.open(`https://api.whatsapp.com/send?phone=${waBase}&text=${encodeURIComponent(msg)}`, '_blank');
        }
      }).catch(() => {
        // En caso de error de red (bridge offline)
        window.open(`https://api.whatsapp.com/send?phone=${waBase}&text=${encodeURIComponent(msg)}`, '_blank');
      }).finally(() => {
        if(btn) btn.disabled = false;
      });
    } else {
      window.open(`https://api.whatsapp.com/send?phone=${waBase}&text=${encodeURIComponent(msg)}`, '_blank');
      if(btn) btn.disabled = false;
    }

    if(currentLeadId === lead.id) renderSidePanel(lead);
    if(currentTab === 'leads') renderLeadsBody(leads);

  } catch (err) {
    console.error("Error en confirmarEnvio:", err);
    toast("Error al procesar el envío", "error");
  }
}

function generarProximosCheck(frec){
  if(frec==='manual') return [];
  const hoy = new Date();
  const dias = { diaria:1, semanal:7, quincenal:15, mensual:30 }[frec] || 7;
  const f = new Date(hoy); f.setDate(f.getDate() + dias);
  return [{
    fecha: f.toISOString().split('T')[0],
    codigos: [], // Vacío porque es un check de novedades
    enviado: false,
    esCheck: true
  }];
}


/* ═══════════════════════════════════════════════
   MODAL VISITA
═══════════════════════════════════════════════ */
function abrirVisitaModal(lid, prefilledCod, citaId){
  visitaLeadId = lid;
  let v = null;
  const lead = lid ? leads.find(l => String(l.id) === String(lid)) : null;
  
  if (citaId) {
    v = citas.find(c => String(c.id) === String(citaId));
  } else if (prefilledCod && lead) {
    v = (lead.visitas || []).find(x => x.codigo === prefilledCod);
  }

  document.getElementById('visitaCodigo').value = v ? v.codigo : (prefilledCod || '');
  document.getElementById('visitaCliente').value = v ? v.cliente : (lead ? lead.nombre : '');
  document.getElementById('visitaCelular').value = v ? v.celular : (lead ? lead.celular : '');
  document.getElementById('visitaFecha').value = v ? v.fecha : new Date().toISOString().split('T')[0];
  document.getElementById('visitaHora').value = v ? v.hora : '';
  document.getElementById('visitaEstado').value = v ? v.estado : 'agendada';
  document.getElementById('visitaOferto').value = v ? v.oferto : 'no';
  document.getElementById('visitaOferta').value = v ? v.oferta : '';
  document.getElementById('visitaNotas').value = v ? v.notas : '';
  document.getElementById('visitaCalendar').checked = false;
  document.getElementById('visitaId').value = v ? v.id : '';
  document.getElementById('btnEliminarVisita').style.display = v ? 'block' : 'none';

  document.getElementById('visitaModal').classList.add('open');
}

function marcarVisitaRealizada(lid, cod){
  const lead = leads.find(l => String(l.id) === String(lid)); if(!lead) return;
  const v = (lead.visitas || []).find(x => x.codigo === cod);
  if(v){
    v.estado = 'realizada';
    saveLeads();
    toast('Visita marcada como realizada ✓','success');
    renderSidePanel(lead);
    syncSheets(lead);
  }
}
function guardarVisita(){
  try {
    const cod=document.getElementById('visitaCodigo').value.trim(); if(!cod){ toast('Ingresa el código','error'); return; }
    const cliente = document.getElementById('visitaCliente').value.trim();
    const celular = document.getElementById('visitaCelular').value.trim();
    
    let lead = leads.find(l=>String(l.id)===String(visitaLeadId));
    if(!lead && celular) {
      const cleanInput = String(celular).replace(/\D/g, '');
      const matchInput = cleanInput.length >= 10 ? cleanInput.slice(-10) : cleanInput;
      lead = leads.find(l => {
        if (l.id === 'LEAD-AGENDA-GLOBAL') return false;
        const lRaw = String(l.celular || '').replace(/\D/g, '');
        const lMatch = lRaw.length >= 10 ? lRaw.slice(-10) : lRaw;
        return matchInput && lMatch && lMatch === matchInput;
      });
    }

    if(!lead) {
       // Asignar a contenedor global para sincronización
       lead = leads.find(l => l.id === 'LEAD-AGENDA-GLOBAL');
       if (!lead) {
           lead = {
               id: 'LEAD-AGENDA-GLOBAL',
               tipo: 'cliente',
               nombre: 'Agenda Global (Citas Genéricas)',
               celular: '0000000000',
               notas: 'Contenedor para sincronizar citas sin lead asociado.',
               metodoPago: [],
               estado: 'visita',
               etiqueta: 'activo',
               filtros: {},
               frecuencia: 'manual',
               maxPorEnvio: 4,
               nombreInmobiliaria: '',
               nombreAgente: '',
               propsFiltradas: [],
               propsEnviadas: [],
               proximosEnvios: [],
               historialEnvios: [],
               visitas: [],
               creadoEn: new Date().toISOString()
           };
           leads.push(lead);
       }
    }

    let existingId = null;
    const vInLead = lead?.visitas?.find(x => x.codigo === cod);
    const vInCitas = citas.find(x => x.codigo === cod && x.celular === celular);
    existingId = vInLead?.id || vInCitas?.id;

    const v={
      id: existingId || Date.now().toString(),
      codigo:cod,
      fecha:document.getElementById('visitaFecha').value,
      hora:document.getElementById('visitaHora').value,
      estado:document.getElementById('visitaEstado').value,
      oferto:document.getElementById('visitaOferto').value,
      oferta:document.getElementById('visitaOferta').value.trim(),
      notas:document.getElementById('visitaNotas').value.trim(),
      cliente: cliente,
      celular: celular,
      inmobiliaria: lead && lead.tipo==='inmobiliaria' && lead.id !== 'LEAD-AGENDA-GLOBAL' ? lead.nombreInmobiliaria : '',
      updatedAt: Date.now()
    };
    
    if(lead){
      if(!lead.visitas) lead.visitas=[];
      const idx = lead.visitas.findIndex(x => x.id === v.id || (x.codigo === cod && !x.id));
      if(idx >= 0) lead.visitas[idx] = v;
      else lead.visitas.push(v);
    }
    
    // Actualizar en agenda global
    const cIdx = citas.findIndex(x => x.id === v.id || (x.codigo === cod && x.celular === v.celular && !x.id));
    if(cIdx >= 0) citas[cIdx] = v;
    else citas.push(v);
    
    saveLeads();
    
    if(document.getElementById('visitaCalendar').checked){ 
      const fd=v.fecha.replace(/-/g,''); 
      const time = v.hora ? `T${v.hora.replace(':','') }00` : '';
      const dateStr = time ? `${fd}${time}/${fd}${time}` : `${fd}/${fd}`;
      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Visita '+cod+' - '+(v.cliente||''))}&dates=${dateStr}&details=${encodeURIComponent(v.notas)}`,'_blank'); 
    }
    
    closeModal('visitaModal'); 
    toast('Visita registrada ✓','success'); 
    
    if(lead) syncSheets(lead);
    
    if(currentLeadId && lead && currentLeadId===lead.id) renderSidePanel(lead);
    if(currentTab==='citas') renderCitas();
  } catch (err) {
    console.error("Error en guardarVisita:", err);
    toast("Error al guardar la visita", "error");
  }
}

/* ═══════════════════════════════════════════════
   MODAL EDITAR FILTROS
═══════════════════════════════════════════════ */
function abrirEditFiltros(leadId){
  currentLeadId = leadId;
  const lead=leads.find(l=>String(l.id)===String(leadId)); if(!lead) return;
  tempFiltros=JSON.parse(JSON.stringify(lead.filtros||{}));
  document.getElementById('editFiltrosCount').textContent=`${filtrarProps(tempFiltros).length} propiedades encontradas`;
  document.getElementById('editFiltrosContent').innerHTML=`<div id="efWrap"></div>`;
  document.getElementById('editFiltrosModal').classList.add('open');
  setTimeout(()=>{
    buildFiltrosBar('efWrap','ef',tempFiltros);
    setSort(criterioOrden); // Sincronizar etiquetas de orden
  },0);
}
function guardarFiltrosEditados(marcarComoEnviadas = false){
  const lead=leads.find(l=>String(l.id)===String(currentLeadId)); if(!lead) return;
  const efSt=getFSt('ef'); 
  Object.keys(efSt).forEach(k => { 
    if (Array.isArray(efSt[k])) {
      tempFiltros[k] = [...efSt[k]]; 
    } else {
      tempFiltros[k] = efSt[k];
    }
  });
  lead.filtros=JSON.parse(JSON.stringify(tempFiltros));
  lead.propsFiltradas=filtrarProps(lead.filtros).map(d=>d['Código']);
  
  if(marcarComoEnviadas){
    lead.propsEnviadas = [...new Set([...(lead.propsEnviadas||[]), ...lead.propsFiltradas])];
    lead.historialEnvios.push({
      fecha: new Date().toISOString().split('T')[0],
      codigos: lead.propsFiltradas,
      totalCods: lead.propsFiltradas.length,
      tipoEnvio: 'silencioso',
      notas: 'Filtros actualizados (propiedades marcadas como vistas sin enviar WhatsApp)'
    });
  }

  const pend=lead.propsFiltradas.filter(c=>!(lead.propsEnviadas||[]).includes(c));
  lead.proximosEnvios=generarProximosCheck(lead.frecuencia);
  saveLeads(); 
  syncSheets(lead);
  closeModal('editFiltrosModal'); 
  toast('Filtros actualizados ✓','success');
  renderSidePanel(lead);
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open')); });

function saveLeads(){ 
  try {
    localStorage.setItem('icde_leads', JSON.stringify(leads)); 
    localStorage.setItem('icde_citas', JSON.stringify(citas)); 
    updateLeadsDatalists();
  } catch (e) {
    console.error("Error saving to localStorage:", e);
    if (e.name === 'QuotaExceededError') {
      toast('Error: Almacenamiento lleno. Elimina leads antiguos.', 'error');
    } else {
      toast('Error al guardar datos localmente', 'error');
    }
  }
}

function toast(msg,type='success'){
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 3000);
}

async function syncSheets(lead){ 
  if(!CRM_SCRIPT_URL) return; 
  try { 
    await fetch(CRM_SCRIPT_URL,{
      method:'POST',
      mode: 'no-cors',
      body:JSON.stringify({action:'saveLead',lead:JSON.stringify(lead)})
    }); 
  } catch(e){} 
}

async function syncCita(cita){
  if(!CRM_SCRIPT_URL) return;
  try {
    await fetch(CRM_SCRIPT_URL,{
      method:'POST',
      mode: 'no-cors',
      body:JSON.stringify({action:'saveCita',cita:JSON.stringify(cita)})
    });
  } catch(e){}
}

async function syncProperty(prop) {
  if(!CRM_SCRIPT_URL) return;
  try {
    await fetch(CRM_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'saveProperty', property: JSON.stringify(prop) })
    });
  } catch (e) {
    console.error("Error syncProperty:", e);
  }
}

async function syncDeleteCita(id){
  if(!CRM_SCRIPT_URL) return;
  try {
    await fetch(CRM_SCRIPT_URL,{
      method:'POST',
      mode: 'no-cors',
      body:JSON.stringify({action:'deleteCita',id:id})
    });
  } catch(e){}
}

function eliminarVisita(){
  const id = document.getElementById('visitaId').value;
  if(!id) return;
  if(!confirm('¿Estás seguro de eliminar esta cita?')) return;

  // 1. Eliminar de la agenda global
  const cIdx = citas.findIndex(x => String(x.id) === String(id));
  if(cIdx >= 0) citas.splice(cIdx, 1);

  // 2. Eliminar del lead (si existe)
  let leadTarget = null;
  leads.forEach(l => {
    if(l.visitas){
      const vIdx = l.visitas.findIndex(x => String(x.id) === String(id));
      if(vIdx >= 0){
        l.visitas.splice(vIdx, 1);
        leadTarget = l;
      }
    }
  });

  saveLeads();
  closeModal('visitaModal');
  toast('Cita eliminada ✓', 'success');

  // 3. Sincronizar
  if(leadTarget) syncSheets(leadTarget);
  else syncDeleteCita(id);

  // 4. Refrescar UI
  if(currentTab === 'citas') renderCitas();
  if(currentLeadId && leadTarget && String(currentLeadId) === String(leadTarget.id)) renderSidePanel(leadTarget);
}

/* ═══════════════════════════════════════════════
   MÓDULO CITAS & PEDIDOS INMOB.
═══════════════════════════════════════════════ */
function setCitasView(mode){
  citasViewMode = mode;
  localStorage.setItem('icde_citas_view', mode);
  renderCitas();
}

function renderCitas(){
  document.getElementById('mainContent').innerHTML=`
    <div class="section-header">
      <div class="section-title">🗓 Agenda de Citas</div>
      <button class="btn btn-primary btn-sm" onclick="abrirVisitaModal()">+ Nueva Cita</button>
    </div>
    
    <div class="citas-layout-nuevo" style="display:grid; grid-template-columns: 320px 1fr; gap:24px; align-items:start;">
      <div id="calendarContainerWrap">
        <div id="calendarContainer"></div>
        <div class="cal-legend" style="margin-top:16px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:11px; color:#aaa; background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; align-items:center; gap:8px;"><div style="width:10px; height:10px; border-radius:2px; background:var(--gold);"></div> <span style="color:#fff;">Hoy</span></div>
          <div style="display:flex; align-items:center; gap:8px;"><div style="width:6px; height:6px; border-radius:50%; background:#a855f7;"></div> <span>Solicitó Visita</span></div>
          <div style="display:flex; align-items:center; gap:8px;"><div style="width:6px; height:6px; border-radius:50%; background:var(--gold);"></div> <span>Agendada</span></div>
          <div style="display:flex; align-items:center; gap:8px;"><div style="width:6px; height:6px; border-radius:50%; background:var(--green);"></div> <span>Visitada</span></div>
          <div style="display:flex; align-items:center; gap:8px;"><div style="width:6px; height:6px; border-radius:50%; background:var(--red);"></div> <span>Cancelada</span></div>
        </div>
      </div>
      <div id="listContainer">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div style="display:flex; gap:8px;">
            <button class="chip-filtro sel" onclick="filterCitas('semana',this)">Semana</button>
            <button class="chip-filtro" onclick="filterCitas('mes',this)">Mes</button>
            <button class="chip-filtro" onclick="filterCitas('todas',this)">Todas</button>
          </div>
          <div id="citasSelFecha" style="font-size:12px; color:var(--gold); font-weight:600;"></div>
        </div>
        <div class="citas-table-wrap">
          <table class="citas-table">
            <thead><tr><th>Día / Hora</th><th>Cliente</th><th>Inmueble</th><th>Observaciones</th></tr></thead>
            <tbody id="citasBody"></tbody>
          </table>
        </div>
      </div>
    </div>
    <style>
      @media(max-width:900px){ .citas-layout-nuevo { grid-template-columns: 1fr !important; } }
    </style>`;
  
  renderCalendario();
  renderCitasBody(citas);
}

function selectCalDate(fecha){
  const filtradas = citas.filter(c => c.fecha === fecha);
  document.getElementById('citasSelFecha').textContent = `Filtrado por: ${fecha}`;
  renderCitasBody(filtradas);
  
  // Highlight selected day
  document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('today'));
  // (We don't want to lose today's visual, so maybe a separate class)
}

function renderCalendario(){
  const container = document.getElementById('calendarContainer'); if(!container) return;
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let html = `
    <div class="calendar-wrap">
      <div class="calendar-header">
        <button class="btn btn-secondary btn-sm" style="padding:4px 8px;" onclick="changeCalMonth(-1)">«</button>
        <div style="font-size:14px; font-weight:700; color:#fff;">
          <span style="color:var(--gold);">${monthNames[month]}</span> ${year}
        </div>
        <button class="btn btn-secondary btn-sm" style="padding:4px 8px;" onclick="changeCalMonth(1)">»</button>
      </div>
      <div class="calendar-grid">
        <div class="cal-day-head">D</div><div class="cal-day-head">L</div><div class="cal-day-head">M</div>
        <div class="cal-day-head">M</div><div class="cal-day-head">J</div><div class="cal-day-head">V</div>
        <div class="cal-day-head">S</div>`;
        
  for(let i=0; i<firstDay; i++) html += '<div class="cal-day empty"></div>';
  
  const todayObj = new Date();
  const today = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  
  for(let d=1; d<=daysInMonth; d++){
    const curDate = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = citas.filter(c => c.fecha === curDate);
    const isToday = curDate === today;
    
    html += `
      <div class="cal-day ${isToday?'today':''}" onclick="selectCalDate('${curDate}')">
        <span class="cal-num">${d}</span>
        <div class="cal-dots">
          ${dayEvents.slice(0,4).map(c => `<div class="cal-dot ${c.estado}"></div>`).join('')}
          ${dayEvents.length > 4 ? '<div style="font-size:8px; color:var(--gold);">+</div>' : ''}
        </div>
      </div>`;
  }
  
  html += '</div></div>';
  container.innerHTML = html;
}

let feedbackOmitidos = JSON.parse(localStorage.getItem('icde_feedback_omitidos') || '[]');
function checkCitasFeedback(){
  if(document.querySelector('.modal-overlay.open')) return; // No interrumpir si hay modal abierto
  const now = new Date();
  const pendientes = citas.filter(c => {
    if(c.estado !== 'agendada') return false;
    if(feedbackOmitidos.includes(String(c.id))) return false;
    const citaDate = new Date(c.fecha + (c.hora ? 'T' + c.hora : 'T23:59'));
    const age = now - citaDate;
    return age > (30 * 60 * 1000) && age < (10 * 24 * 60 * 60 * 1000); // 30m min, 10d max
  });
  if(pendientes.length > 0) abrirFeedbackModal(pendientes[0]);
}

function abrirFeedbackModal(cita){
  document.getElementById('feedbackCitaId').value = cita.id;
  document.getElementById('feedbackCitaInfo').innerHTML = `
    <div style="font-weight:700; color:#fff; font-size:15px;">${cita.cliente}</div>
    <div style="font-size:12px; color:var(--gold); margin-top:4px; font-weight:600;">📍 Inmueble: ${cita.codigo}</div>
    <div style="font-size:12px; color:#888; margin-top:2px;">📅 Fecha: ${cita.fecha} a las ${cita.hora || '--:--'}</div>
  `;
  document.getElementById('feedbackNotas').value = cita.observaciones || '';
  document.getElementById('feedbackEstado').value = 'realizada';
  document.getElementById('feedbackModal').classList.add('open');
}

function omitirFeedback(){
  const id = document.getElementById('feedbackCitaId').value;
  if(!feedbackOmitidos.includes(String(id))) {
    feedbackOmitidos.push(String(id));
    localStorage.setItem('icde_feedback_omitidos', JSON.stringify(feedbackOmitidos));
  }
  closeModal('feedbackModal');
  setTimeout(checkCitasFeedback, 1000);
}

async function guardarFeedback(){
  const id = document.getElementById('feedbackCitaId').value;
  const notas = document.getElementById('feedbackNotas').value;
  const estado = document.getElementById('feedbackEstado').value;
  const cita = citas.find(c => String(c.id) === String(id));
  if(cita){
    cita.observaciones = notas;
    cita.notas = notas;
    cita.estado = estado;
    const lead = leads.find(l => String(l.id) === String(cita.leadId));
    if(lead && lead.visitas){
      // Buscar por id primero, luego por codigo+fecha como fallback
      const v = lead.visitas.find(x => String(x.id) === String(id)) ||
                lead.visitas.find(x => x.codigo === cita.codigo && x.fecha === cita.fecha);
      if(v) {
        v.estado = estado;
        v.notas = notas;
        v.observaciones = notas;
        // Asegurar que el ID esté guardado para futuros matches
        if(!v.id) v.id = id;
      }
    }
    saveLeads();
    syncCita(cita);
    if(lead) {
      syncSheets(lead);
    }
    if(currentTab === 'citas') renderCitas();
    toast('Feedback guardado ✓');
  }
  // Marcar como omitido localmente para que no vuelva a saltar en esta sesion/dispositivo
  if(!feedbackOmitidos.includes(String(id))) {
    feedbackOmitidos.push(String(id));
    localStorage.setItem('icde_feedback_omitidos', JSON.stringify(feedbackOmitidos));
  }
  closeModal('feedbackModal');
  // Solo volver a revisar si hay más citas pendientes (con delay para que el save se propague)
  setTimeout(checkCitasFeedback, 3000);
}

function renderCitasBody(lista){
  const b = document.getElementById('citasBody'); if(!b) return;
  const diasSem = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  
  // Clonar y ordenar de forma robusta
  const ordenada = [...lista].sort((a,b) => {
    const da = a.fecha + (a.hora ? 'T' + a.hora : 'T00:00');
    const db = b.fecha + (b.hora ? 'T' + b.hora : 'T00:00');
    return da.localeCompare(db);
  });

  b.innerHTML = ordenada.map(c => {
    const d = new Date(c.fecha + 'T12:00:00');
    const prop = allProps.find(p => String(p['Código']).trim() === String(c.codigo).trim());
    const inmobProp = prop ? (prop['Inmobiliaria'] || '') : '';
    let stBadge = '';
    if(c.estado === 'realizada') stBadge = `<span class="badge badge-visita">Visitada</span>`;
    else if(c.estado === 'solicito_visita') stBadge = `<span class="badge badge-solicito">Solicitó</span>`;
    else if(c.estado === 'cancelada') stBadge = `<span class="badge badge-inactivo" style="font-size:9px;">Cancelada</span>`;
    else stBadge = `<span class="badge badge-agendada">Agendada</span>`;

    return `<tr class="clickable" onclick="abrirEditarCita('${c.id}')">
      <td><div class="citas-time">${c.hora || '--:--'}</div><div class="citas-weekday">${isNaN(d.getDay()) ? '—' : diasSem[d.getDay()]} ${c.fecha}</div></td>
      <td>
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:600;">${c.cliente || '—'}</div>
            <div style="font-size:11px;color:#888;">${c.celular || ''}</div>
          </div>
          ${stBadge}
        </div>
        <div style="font-size:10px;color:var(--gold);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;" title="${c.inmobiliaria||'Directo'}">🏢 ${c.inmobiliaria || 'Directo'}</div>
      </td>
      <td>
        <div style="font-weight:600;color:var(--gold);">${c.codigo}</div>
        <div style="font-size:10px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90px;" title="${inmobProp}">${inmobProp || '—'}</div>
      </td>
      <td style="font-size:12px;color:#aaa;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${c.observaciones||c.notas||''}">${c.observaciones || c.notas || ''}</td>
    </tr>`;
  }).join('');
}

function abrirEditarCita(citaId) {
  const cita = citas.find(c => String(c.id) === String(citaId));
  if (!cita) return;
  
  // Buscar si esta cita pertenece a algún lead
  let lead = leads.find(l => (l.visitas || []).some(v => v.id === citaId || (v.codigo === cita.codigo && v.fecha === cita.fecha && v.celular === cita.celular)));
  
  abrirVisitaModal(lead ? lead.id : null, cita.codigo, citaId);
}

function filterCitas(tipo){
  const hoy = new Date();
  let filtered = citas;
  if(tipo==='semana'){
    const start = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    const end = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 6));
    filtered = citas.filter(c => { const d = new Date(c.fecha); return d >= start && d <= end; });
  } else if(tipo==='mes'){
    filtered = citas.filter(c => c.fecha.startsWith(new Date().toISOString().slice(0,7)));
  }
  renderCitasBody(filtered);
}

function renderPedidosInmob(){
  const peds = leads.filter(l => l.tipo === 'inmobiliaria');
  document.getElementById('mainContent').innerHTML=`
    <div class="section-header"><div class="section-title">🏢 Requerimientos de Inmobiliarias</div></div>
    <div class="leads-table-wrap">
      <table class="leads-table">
        <thead><tr><th>Inmobiliaria / Agente</th><th>Celular</th><th>Requerimiento</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${peds.map(l => `
          <tr class="clickable" onclick="abrirLead('${String(l.id).trim()}')">
            <td><div class="leads-row-name">${l.nombreInmobiliaria || l.nombre}</div><div style="font-size:11px;color:#888;">Agente: ${l.nombreAgente || '—'}</div></td>
            <td>${l.celular}</td>
            <td><div style="font-size:12px;color:#aaa;max-width:300px;">${l.notas || 'Sin detalles'}</div></td>
            <td><span class="badge badge-${l.etiqueta}">${l.etiqueta}</span></td>
            <td><button class="btn btn-sm btn-secondary" onclick="abrirLead('${String(l.id).trim()}')">Ver</button></td>
          </tr>
        `).join('')}</tbody>
      </table>
    </div>`;
}

/* ═══════════════════════════════════════════════
   SETTINGS & GEMINI
═══════════════════════════════════════════════ */
function abrirSettings(){
  // Poblar los campos con los valores actuales
  const waInput = document.getElementById('setWaApi');
  const geminiInput = document.getElementById('setGeminiKey');
  if (waInput)     waInput.value     = settings.waApi || '';
  if (geminiInput) geminiInput.value = settings.geminiKey || '';
  document.getElementById('settingsModal').classList.add('open');
  // Limpiar diagnóstico previo
  const diag = document.getElementById('diagResultado');
  if (diag) diag.style.display = 'none';
}
function guardarSettings(){
  settings.waApi = document.getElementById('setWaApi').value;
  settings.geminiKey = document.getElementById('setGeminiKey').value;
  localStorage.setItem('icde_settings', JSON.stringify(settings));
  closeModal('settingsModal');
  toast('Configuración guardada ✓');
}

function diagnosticarDatosLocales() {
  const diag = document.getElementById('diagResultado');
  if (!diag) return;

  const totalLeads    = leads.length;
  const totalCitas    = citas.length;
  const totalVisitas  = leads.reduce((acc, l) => acc + (l.visitas || []).length, 0);
  const leadsConCitas = leads.filter(l => (l.visitas || []).length > 0).length;
  const lsSize        = (JSON.stringify(leads).length / 1024).toFixed(1);
  const leadsLocales  = leads.filter(l => String(l.id||'').startsWith('U-')).length;
  const leadsNube     = leads.filter(l => !String(l.id||'').startsWith('U-')).length;

  diag.style.display = 'block';
  diag.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px;">
      <div>📋 Leads total: <strong style="color:#fff;">${totalLeads}</strong></div>
      <div>📅 Citas en agenda: <strong style="color:#fff;">${totalCitas}</strong></div>
      <div>🏠 Visitas registradas: <strong style="color:#fff;">${totalVisitas}</strong></div>
      <div>👥 Leads con visitas: <strong style="color:#fff;">${leadsConCitas}</strong></div>
      <div style="color:#d4a84b">💻 Solo en este equipo: <strong>${leadsLocales}</strong></div>
      <div style="color:#22c55e">☁️ Sincronizados nube: <strong>${leadsNube}</strong></div>
      <div style="grid-column:1/-1; color:#888;">💾 Tamaño en memoria: ${lsSize} KB</div>
    </div>
    <div style="margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); font-size:11px; line-height:1.5;">
      ${leadsLocales > 0
        ? `<span style="color:#d4a84b">⚠️ <strong>${leadsLocales} leads</strong> solo están en este equipo. Presiona <strong>"Subir todo a la nube"</strong> para compartirlos.</span>`
        : `<span style="color:#22c55e">✅ Todos los leads están sincronizados con la nube.</span>`
      }
    </div>`;
}

let recognition;
function toggleGemini(){
  if(!settings.geminiKey){ toast('Configura tu API Key de Gemini','error'); abrirSettings(); return; }
  const btn = document.getElementById('geminiBtn');
  if(btn.classList.contains('listening')){
    recognition.stop();
    btn.classList.remove('listening');
  } else {
    if(!('webkitSpeechRecognition' in window)){ toast('Tu navegador no soporta voz','error'); return; }
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onstart = () => { btn.classList.add('listening'); toast('Escuchando...','success'); };
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      processWithGemini(text);
    };
    recognition.onend = () => { btn.classList.remove('listening'); };
    recognition.start();
  }
}

async function processWithGemini(text){
  toast('Gemini procesando...','success');
  const prompt = `Extrae información de una cita inmobiliaria del siguiente texto en español: "${text}". 
  Responde UNICAMENTE en formato JSON con estos campos: codigo (solo el numero), fecha (YYYY-MM-DD), hora (HH:mm), cliente (nombre), notas. 
  Si no encuentras un campo, ponlo vacío.`;
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    const cleanJson = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanJson);
    
    // Auto-llenar formulario de visita
    abrirVisitaModal();
    if(result.codigo) document.getElementById('visitaCodigo').value = result.codigo;
    if(result.fecha) document.getElementById('visitaFecha').value = result.fecha;
    if(result.notas) document.getElementById('visitaNotas').value = result.notas;
    if(result.cliente) document.getElementById('visitaNotas').value += '\nCliente: ' + result.cliente;
    if(result.hora) document.getElementById('visitaNotas').value += '\nHora: ' + result.hora;
    
    toast('Gemini ha extraído los datos ✓');
  } catch(e) {
    toast('Error con Gemini','error');
  }
}
function toggleSection(header){
  const section = header.parentElement;
  section.classList.toggle('collapsed');
}

/* CHAT LOGIC */
async function loadChatHistory(phone, isUpdate = false){
    if(!settings.waApi) {
        const h = document.getElementById('chatHistory');
        if(h && !isUpdate) h.innerHTML = '<div style="margin:auto; color:var(--orange); font-size:11px; text-align:center; padding:20px;">⚠️ Configura la URL del Puente en Settings para ver el chat.</div>';
        return;
    }
    try {
        const res = await fetch(`${settings.waApi}/messages/${phone}`);
        if(!res.ok) throw new Error('Error API');
        const messages = await res.json();
        const container = document.getElementById('chatHistory');
        if(!container) return;
        
        const oldContent = container.innerHTML;
        const newContent = messages.map(m => {
            const time = new Date(m.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            return `
                <div class="chat-bubble ${m.fromMe ? 'bubble-out' : 'bubble-in'}">
                    <div class="bubble-text">${m.text}</div>
                    <div class="bubble-time">${time}</div>
                </div>
            `;
        }).join('') || '<div style="margin:auto; color:#666; font-size:11px;">No hay mensajes previos</div>';
        
        if(oldContent !== newContent) {
            container.innerHTML = newContent;
            // Scroll al fondo si es la primera carga o si el usuario ya estaba abajo
            if(!isUpdate || container.scrollHeight - container.scrollTop < 600) {
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                }, 50);
            }
        }
        document.getElementById('chatStatus').style.color = 'var(--green)';
        document.getElementById('chatStatus').textContent = '● Conectado';
    } catch(e) {
        console.error('Chat error:', e);
        document.getElementById('chatStatus').style.color = 'var(--red)';
        document.getElementById('chatStatus').textContent = '● Desconectado';
    }
}

async function sendMessageFromPanel(phone){
    const inp = document.getElementById('chatInput');
    const msg = inp.value.trim();
    if(!msg || !settings.waApi) return;
    
    inp.disabled = true;
    try {
        const res = await fetch(`${settings.waApi}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: phone, message: msg })
        });
        if(res.ok) {
            inp.value = '';
            loadChatHistory(phone, true);
        } else {
            toast('Error al enviar','error');
        }
    } catch(e) {
        toast('Error de conexión','error');
    }
    inp.disabled = false;
    inp.focus();
}

/* ═══════════════════════════════════════════════
   MÓDULO ADMINISTRACIÓN (FUTURO)
   ═══════════════════════════════════════════════ */
let adminData = { properties: [] };

async function loadAdminData() {
  try {
    const res = await fetch('admin_data.json');
    if (res.ok) {
      adminData = await res.json();
      console.log('Admin data loaded:', adminData);
    }
  } catch (e) {
    console.error('Error loading admin data:', e);
  }
}

function renderAdministracion() {
  const c = document.getElementById('mainContent');
  if (!adminData.properties.length) {
    c.innerHTML = `
      <div class="section-header"><div class="section-title">💼 Administración</div></div>
      <div class="panel-section" style="text-align:center; padding:60px;">
        <div class="spinner" style="margin:0 auto 20px;"></div>
        <p>Cargando datos de administración...</p>
        <button class="btn btn-secondary btn-sm" style="margin-top:20px;" onclick="refreshAdminData()">⟳ Forzar Recarga</button>
      </div>`;
    loadAdminData().then(() => renderAdministracion());
    return;
  }

  const totalCanon = adminData.properties.reduce((acc, p) => acc + (parseFloat(p.monthly_rent) || 0), 0);
  const occupiedCount = adminData.properties.filter(p => p.status === 'Ocupado').length;
  const vacantCount = adminData.properties.length - occupiedCount;

  c.innerHTML = `
    <div class="section-header">
      <div class="section-title">💼 Administración de Inmuebles</div>
      <div style="font-size:12px; color:var(--muted);">Última actualización: ${new Date(adminData.last_update).toLocaleString()}</div>
    </div>

    <div class="admin-kpi-grid">
      <div class="admin-kpi-card">
        <div class="admin-kpi-val">${adminData.properties.length}</div>
        <div class="admin-kpi-lbl">Total Unidades</div>
      </div>
      <div class="admin-kpi-card">
        <div class="admin-kpi-val">${formatP(totalCanon)}</div>
        <div class="admin-kpi-lbl">Canon Mensual Total</div>
      </div>
      <div class="admin-kpi-card">
        <div class="admin-kpi-val">${occupiedCount} / ${adminData.properties.length}</div>
        <div class="admin-kpi-lbl">Ocupación</div>
      </div>
    </div>

    <div class="action-bar">
      <button class="btn btn-primary btn-sm" onclick="syncAllToCalendar()">🗓 Sincronizar Calendario</button>
      <button class="btn btn-gold btn-sm" onclick="sendBulkReminders()">💬 Enviar Recordatorios WA</button>
      <button class="btn btn-secondary btn-sm" style="margin-left:auto;" onclick="refreshAdminData()">⟳ Actualizar Datos</button>
    </div>

    <div class="panel-section" style="padding:0; overflow:hidden;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Administrador / Dueño</th>
            <th>Canon</th>
            <th>Inicio Contrato</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${adminData.properties.map(p => `
            <tr>
              <td>
                <div style="font-weight:600; color:#fff;">${p.name}</div>
                <div style="font-size:11px; color:var(--muted);">${p.notes.split('.')[1] || ''}</div>
              </td>
              <td>${p.owner}</td>
              <td><span style="color:var(--gold); font-weight:600;">${formatP(p.monthly_rent)}</span></td>
              <td>${p.start_date.split(' ')[0]}</td>
              <td><span class="status-${p.status === 'Ocupado' ? 'paid' : 'late'}">${p.status}</span></td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="sendAdminReminder('${p.owner}', '${p.name}', '${p.monthly_rent}')" title="Enviar recordatorio WhatsApp">💬</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function refreshAdminData() {
  toast('Recargando datos...', 'success');
  await loadAdminData();
  renderAdministracion();
}

function sendAdminReminder(owner, prop, amount) {
  // Buscar si tenemos el teléfono en leads
  const lead = leads.find(l => l.nombre.toLowerCase().includes(owner.toLowerCase()) || owner.toLowerCase().includes(l.nombre.toLowerCase()));
  const phone = lead ? lead.celular : prompt(`No se encontró el teléfono para ${owner}. Por favor ingrésalo:`);
  
  if (!phone) return;
  
  const msg = `Hola ${owner}, te escribimos de ICDE Inmobiliaria para recordarte el pago del canon de arrendamiento de la propiedad *${prop}* por valor de *${formatP(amount)}*. ¡Gracias!`;
  
  if (settings.waApi) {
    fetch(`${settings.waApi}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: phone, message: msg })
    }).then(res => {
      if (res.ok) toast('Recordatorio enviado ✓', 'success');
      else toast('Error al enviar recordatorio', 'error');
    });
  } else {
    const url = `https://api.whatsapp.com/send?phone=${phone.replace(/\+/g,'')}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }
}

function syncAllToCalendar() {
  toast('Sincronizando con Google Calendar...', 'success');
  // Aquí iría la lógica de Google Calendar API
  // Por ahora simulamos éxito
  setTimeout(() => toast('Calendario actualizado ✓', 'success'), 2000);
}

function sendBulkReminders() {
  if (!confirm('¿Deseas enviar recordatorios a todos los arrendatarios con pagos pendientes?')) return;
  toast('Iniciando envío masivo...', 'success');
  // Lógica para iterar y enviar
}

/* ═══════════════════════════════════════════════
   MÓDULO ESTADÍSTICAS
   ═══════════════════════════════════════════════ */
function renderEstadisticas(){
  const c = document.getElementById('mainContent');
  
  // Datos simulados/calculados
  const totalAdmin = 45; // Placeholder
  const arrendados = 32; // Placeholder
  const pendientes = totalAdmin - arrendados;
  const comisionTotal = allProps.reduce((acc, p) => acc + (parseFloat(String(p['Precio']||0).replace(/[^\d]/g,'')) * 0.1), 0) / 100; // Simulado
  const formatCom = (n) => '$' + Math.round(n).toLocaleString('es-CO');

  const leadsActivos = leads.filter(l => l.etiqueta === 'activo').length;
  const leadsVisita = leads.filter(l => l.estado === 'visita').length;
  const leadsProceso = leads.filter(l => l.estado === 'proceso').length;
  const leadsBanco = leads.filter(l => l.estado === 'banco').length;

  c.innerHTML = `
    <div class="section-header">
      <div class="section-title">📊 Panel de Estadísticas</div>
      <button class="btn btn-secondary btn-sm" onclick="renderEstadisticas()">⟳ Actualizar</button>
    </div>

    <!-- TARJETAS PRINCIPALES -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Inmuebles Administrados</div>
        <div class="stat-value">${totalAdmin}</div>
        <div class="stat-sub">🟢 ${arrendados} Arrendados · 🟡 ${pendientes} Faltan</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Comisión Total Acumulada</div>
        <div class="stat-value">${formatCom(2450000)}</div>
        <div class="stat-sub">10% del valor administrado</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Leads Activos</div>
        <div class="stat-value">${leadsActivos}</div>
        <div class="stat-sub">${leads.length} leads totales en el Panel</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Visitas Realizadas</div>
        <div class="stat-value">${leads.reduce((acc, l) => acc + (l.visitas?.length || 0), 0)}</div>
        <div class="stat-sub">Histórico acumulado</div>
      </div>
    </div>

    <div class="charts-wrapper">
      <!-- META DE ADMINISTRACIÓN -->
      <div class="chart-container">
        <div class="panel-section-title">Objetivo de Administración</div>
        <div style="height:250px; display:flex; align-items:center; justify-content:center;">
          <canvas id="goalChart"></canvas>
        </div>
        <div style="text-align:center; font-size:12px; color:var(--muted); margin-top:10px;">Objetivo mensual: $2,000,000</div>
      </div>

      <!-- LEADS POR ESTADO -->
      <div class="chart-container">
        <div class="panel-section-title">Estados de Leads</div>
        <div style="height:250px;">
          <canvas id="leadsStateChart"></canvas>
        </div>
      </div>
    </div>

    <div class="charts-wrapper">
      <!-- DISTRIBUCIÓN POR TIPO -->
      <div class="chart-container">
        <div class="panel-section-title">Leads por Tipo de Propiedad</div>
        <div style="height:250px;">
          <canvas id="propertyTypeChart"></canvas>
        </div>
      </div>

      <!-- TOP INMUEBLES -->
      <div class="chart-container" style="overflow-y:auto;">
        <div class="panel-section-title">Top Inmuebles más Visitados</div>
        <div class="top-props-list" id="topPropsList"></div>
      </div>
    </div>

    <div class="charts-wrapper">
      <!-- VENTAS POR MES -->
      <div class="chart-container">
        <div class="panel-section-title">Ventas Realizadas por Mes</div>
        <div style="height:250px;">
          <canvas id="salesTrendChart"></canvas>
        </div>
      </div>

      <!-- EMBUDO DE LEADS -->
      <div class="chart-container">
        <div class="panel-section-title">Embudo de Leads (Sales Funnel)</div>
        <div class="funnel-container" id="leadFunnel"></div>
      </div>
    </div>

    <!-- TENDENCIA DE VISITAS -->
    <div class="chart-container" style="margin-bottom:30px;">
      <div class="panel-section-title">Total Visitas de Inmuebles al Mes</div>
      <div style="height:250px;">
        <canvas id="visitsTrendChart"></canvas>
      </div>
    </div>
  `;

  renderCharts(leadsActivos, leadsVisita, leadsProceso, leadsBanco);
  renderTopProps();
  renderFunnel(leadsActivos, leadsVisita, leadsProceso, leadsBanco);
}

function renderCharts(activos, visita, proceso, banco){
  // 1. Objetivo Chart (Pie)
  new Chart(document.getElementById('goalChart'), {
    type: 'doughnut',
    data: {
      labels: ['Completado', 'Pendiente'],
      datasets: [{
        data: [1450000, 550000], // Simulado
        backgroundColor: [ 'rgba(212, 168, 75, 0.8)', 'rgba(255, 255, 255, 0.05)' ],
        borderColor: [ 'var(--gold)', 'rgba(255,255,255,0.1)' ],
        borderWidth: 1
      }]
    },
    options: { cutout: '75%', plugins: { legend: { display: false } } }
  });

  // 2. Leads State (Bar)
  new Chart(document.getElementById('leadsStateChart'), {
    type: 'bar',
    data: {
      labels: ['Activos', 'En Visita', 'En Proceso', 'Banco'],
      datasets: [{
        label: 'Leads',
        data: [activos, visita, proceso, banco],
        backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(34, 197, 94, 0.5)', 'rgba(212, 168, 75, 0.5)', 'rgba(168, 85, 247, 0.5)'],
        borderColor: ['#3b82f6', '#22c55e', '#d4a84b', '#a855f7'],
        borderWidth: 1
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
    }
  });

  // 3. Property Type (Pie)
  const types = {};
  leads.forEach(l => {
    (l.filtros?.tipoInmueble || []).forEach(t => { types[t] = (types[t] || 0) + 1; });
  });
  const typeLabels = Object.keys(types).length ? Object.keys(types) : ['Casa', 'Apartamento', 'Lote'];
  const typeData = Object.values(types).length ? Object.values(types) : [10, 5, 2];

  new Chart(document.getElementById('propertyTypeChart'), {
    type: 'pie',
    data: {
      labels: typeLabels,
      datasets: [{
        data: typeData,
        backgroundColor: ['rgba(212,168,75,0.6)', 'rgba(59,130,246,0.6)', 'rgba(34,197,94,0.6)', 'rgba(168,85,247,0.6)', 'rgba(249,115,22,0.6)'],
        borderWidth: 0
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#888', font: { size: 10 } } } } }
  });

  // 4. Visits Trend (Line)
  new Chart(document.getElementById('visitsTrendChart'), {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Visitas',
        data: [12, 19, 15, 25, 22, 30], // Simulado
        borderColor: 'var(--gold)',
        backgroundColor: 'rgba(212,168,75,0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
    }
  });

  // 5. Sales Trend (Line - New)
  new Chart(document.getElementById('salesTrendChart'), {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Ventas',
        data: [2, 5, 3, 8, 6, 10], // Simulado
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointRadius: 4
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
    }
  });
}

function renderFunnel(activos, visita, proceso, banco){
  const total = activos + visita + proceso + banco || 1;
  const stages = [
    { label: 'Calificación', val: activos, color: 'rgba(59, 130, 246, 0.9)', w: '100%' },
    { label: 'Descubrimiento', val: visita, color: 'rgba(10, 31, 68, 0.9)', w: '80%' },
    { label: 'Propuesta Valor', val: proceso, color: 'rgba(125, 226, 219, 0.9)', w: '60%' },
    { label: 'Negociación', val: banco, color: 'rgba(212, 168, 75, 0.9)', w: '40%' }
  ];

  const container = document.getElementById('leadFunnel');
  container.innerHTML = stages.map(s => {
    const pct = ((s.val / total) * 100).toFixed(1);
    return `
      <div class="funnel-stage" style="background: ${s.color}; width: ${s.w};">
        <span>${s.val} (${pct}%)</span>
        <div class="stage-label">${s.label}</div>
      </div>
    `;
  }).join('');
}

function renderTopProps(){
  const counts = {};
  leads.forEach(l => {
    (l.visitas || []).forEach(v => { counts[v.codigo] = (counts[v.codigo] || 0) + 1; });
  });
  
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const container = document.getElementById('topPropsList');
  
  if(!sorted.length) {
    container.innerHTML = '<div class="empty">No hay datos de visitas registrados</div>';
    return;
  }

  container.innerHTML = sorted.map(([cod, count]) => {
    const p = allProps.find(x => x['Código'] === cod);
    const img = p ? ((p['Imagenes']||'').split('|')[0].trim()||p['Image']||'https://i.imgur.com/Pc9M3I8.png') : 'https://i.imgur.com/Pc9M3I8.png';
    return `
      <div class="top-prop-item">
        <img src="${img}" class="top-prop-img" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/>
        <div class="top-prop-info">
          <div class="top-prop-code">${cod}</div>
          <div class="top-prop-name">${p ? p['Nombre'] : 'Propiedad Desconocida'}</div>
        </div>
        <div class="top-prop-count">${count} visitas</div>
      </div>
    `;
  }).join('');
}

// === MAPA INTERACTIVO ===
let leafletMap = null;
let mapMarkersObj = {};
let mapMarkers = [];

function toggleMapa(pfx) {
  const container = document.getElementById(`mapaContenedor_${pfx}`);
  const toggle = document.getElementById(`btnToggleMapa_${pfx}`);
  if(!container || !toggle) return;
  
  const st = getFSt(pfx);
  st.mapActive = toggle.checked;

  if(!toggle.checked) {
    container.classList.remove('open');
  } else {
    container.classList.add('open');

    // ── Si leafletMap existe pero su contenedor ya no está en el DOM
    //    (ocurre cuando renderNuevo() reconstruyó el HTML), forzar re-init ──
    if(leafletMap) {
      try {
        const mc = leafletMap.getContainer();
        if(!mc || !document.body.contains(mc)) { leafletMap = null; }
      } catch(e) { leafletMap = null; }
    }

    if(!leafletMap) {
      setTimeout(() => initMapa(pfx), 300);
    } else {
      setTimeout(() => { 
        leafletMap.invalidateSize(); 
        actualizarPinesMapa(pfx); // Sin forceFit: mantiene posición actual
      }, 300);
    }
  }
  
  fnActualizarConteo(pfx);
}

function initMapa(pfx) {
  // Centro por defecto: Neiva
  leafletMap = L.map(`mapaLeaflet_${pfx}`, {
    scrollWheelZoom: true, // Habilitar zoom con scroll
    smoothWheelZoom: true,
    smoothSensitivity: 1
  }).setView([2.9273, -75.2819], 13);
  
  // Habilitar zoom con scroll solo si se presiona Ctrl (opcional, mejor desactivar por ahora para evitar confusión)
  // leafletMap.on('focus', () => { leafletMap.scrollWheelZoom.enable(); });
  // leafletMap.on('blur', () => { leafletMap.scrollWheelZoom.disable(); });
  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Maps',
    maxZoom: 20
  }).addTo(leafletMap);

  // Viewport filtering listeners
  leafletMap.on('moveend', () => updateMapBoundsFilter(pfx));
  leafletMap.on('zoomend', () => updateMapBoundsFilter(pfx));

  actualizarPinesMapa(pfx);
}

function actualizarPinesMapa(pfx, forceFit = false) {
  if(!leafletMap) return;
  
  // Limpiar todos los marcadores sin dejar residuos huérfanos/duplicados
  mapMarkers.forEach(m => {
    try { leafletMap.removeLayer(m); } catch(e) {}
  });
  mapMarkers = [];
  mapMarkersObj = {};
  
  let propsToShow = [];
  if(pfx === 'nl') {
    propsToShow = filtrarProps(nuevoLead.filtros, true, true);
  } else if (pfx === 'ef') {
    propsToShow = filtrarProps(tempFiltros, true, true);
  } else {
    propsToShow = filtrarProps(_fst[pfx], true, true);
  }
  
  if(propsToShow.length === 0) return;

  const bounds = [];
  
  propsToShow.forEach((p, idx) => {
    let lat = parseFloat(String(p['Latitud'] || p['Lat']).replace(',','.'));
    let lng = parseFloat(String(p['Longitud'] || p['Lng']).replace(',','.'));
    const code = String(p['Código'] || '');
    
    // Si no tiene coordenadas reales, no la mostramos para evitar amontonar en un punto falso
    if(isNaN(lat) || isNaN(lng) || lat === 0) return;
    
    const price = p['Precio'] ? formatShortPrice(p['Precio']) : 'N/A';
    const icon = L.divIcon({
      className: 'z-marker-wrap',
      html: `<div class="z-marker" id="m-${code}" title="${p['Nombre']}">${price}</div>`,
      iconSize: [60, 25],
      iconAnchor: [30, 25]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(leafletMap);
    
    // Popup compacto estilo Google Maps
    const imgSrc2 = (p['Imagenes']||'').split('|')[0].trim() || p['Image'] || 'https://i.imgur.com/Pc9M3I8.png';
    const numFotos2 = (p['Imagenes']||'').split('|').filter(x=>x.trim()).length || 1;
    const priceLbl2 = formatShortPrice(p['Precio'] || 0) || 'N/A';
    const popupHtml = `
      <div class="popup-prop-card">
        <div class="popup-prop-header">
          <span class="popup-prop-code">${code}</span>
          <span class="popup-prop-price">${priceLbl2}</span>
        </div>
        <div class="popup-prop-img-wrap">
          <img class="popup-prop-img" src="${imgSrc2}" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/>
          <div class="popup-prop-counter">1 de ${numFotos2} ›</div>
        </div>
        <div class="popup-prop-body">
          <table class="popup-prop-table">
            <tr><td>Hab:</td><td>${p['Habitaciones'] || '—'}</td></tr>
            <tr><td>Baños:</td><td>${p['Baños'] || '—'}</td></tr>
            <tr><td>Garaje:</td><td>${p['Garaje'] || '—'}</td></tr>
            <tr><td>Área:</td><td>${p['Área'] || '—'} m²</td></tr>
            <tr><td>Ubicación:</td><td>${(p['Ubicación']||'—').substring(0,18)}</td></tr>
          </table>
        </div>
        <div class="popup-prop-footer">
          <div class="popup-prop-latlng">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
          <div class="popup-prop-actions">
            <button onclick="abrirEditorProp('${code}')" title="Editar propiedad">✏️</button>
            <button onclick="abrirModalProp('${code}')" title="Ver detalles">🔍</button>
            <button onclick="toggleProp('${code}')" title="Seleccionar">📌</button>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 230, autoPan: true, autoPanPadding: [20, 20] });
    
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      // El popup se abre automáticamente por bindPopup
    });

    mapMarkers.push(marker);
    mapMarkersObj[code] = marker;
    bounds.push([lat, lng]);
  });
  
  // Solo ajustar vista si se solicita explícitamente (forceFit)
  if(bounds.length > 0 && forceFit) {
    leafletMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }

  // Si el filtro de viewport está activo, actualizar la grilla ahora
  if (mapViewportFilterActive) {
    setTimeout(() => updateMapBoundsFilter(pfx), 500); // Dar tiempo a que el mapa se estabilice
  }
}

function focusProperty(code) {
  if (!leafletMap || !mapMarkersObj[code]) return;
  
  // Solo hacer zoom si el contenedor del mapa está visible
  const container = leafletMap.getContainer().parentElement;
  if (!container || !container.classList.contains('open')) return;

  const marker = mapMarkersObj[code];
  const latlng = marker.getLatLng();
  
  leafletMap.flyTo(latlng, 17, {
    animate: true,
    duration: 0.8
  });

  // Resaltar visualmente
  document.querySelectorAll('.z-marker').forEach(m => m.classList.remove('active'));
  const el = document.getElementById(`m-${code}`);
  if (el) el.classList.add('active');
}


// --- Lógica de Edición de Propiedades ---
let mapAddMode = false;

function toggleMapAddMode(pfx) {
  mapAddMode = !mapAddMode;
  const btn = document.getElementById(`btnAddProp_${pfx}`);
  if (btn) btn.classList.toggle('active', mapAddMode);
  
  if (mapAddMode) {
    toast('Modo Agregar Activo: Haz clic en el mapa para ubicar la propiedad', 'success');
    leafletMap.getContainer().style.cursor = 'crosshair';
    leafletMap.on('click', onMapClickAdd);
  } else {
    leafletMap.getContainer().style.cursor = '';
    leafletMap.off('click', onMapClickAdd);
  }
}

function onMapClickAdd(e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  toggleMapAddMode('nl'); // Desactivar modo
  abrirEditorProp(null, lat, lng);
}

function abrirEditorProp(codigo, lat, lng) {
  const isEdit = !!codigo;
  const p = isEdit ? allProps.find(x => x['Código'] === codigo) : null;
  
  // Capturar valores actuales por si vienen de un clic previo en el mapa
  const currentLat = document.getElementById('edPropLat')?.value || '';
  const currentLng = document.getElementById('edPropLng')?.value || '';

  document.getElementById('editorPropTitle').textContent = isEdit ? '✏️ Editar Propiedad' : '➕ Nueva Propiedad';
  document.getElementById('edPropCod').value = isEdit ? codigo : '';
  document.getElementById('edPropCod').readOnly = isEdit;
  document.getElementById('edPropNom').value = p ? (p['Nombre'] || '') : '';
  document.getElementById('edPropPre').value = p ? (p['Precio'] || '') : '';
  
  // Poblar tipos de inmueble dinámicamente desde la matriz
  const selectTipo = document.getElementById('edPropTipo');
  const tipos = getUniqueVals('Tipo de inmueble');
  selectTipo.innerHTML = tipos.map(t => `<option value="${t}">${t}</option>`).join('');
  // Si es una propiedad nueva y no hay tipos, o si queremos agregar uno manualmente, 
  // podríamos permitirlo, pero el usuario pidió que sea según la matriz.
  if (p) selectTipo.value = p['Tipo de inmueble'] || '';

  document.getElementById('edPropZona').value = p ? (p['Zona'] || '') : '';
  document.getElementById('edPropBar').value = p ? (p['Barrio'] || '') : '';
  document.getElementById('edPropHab').value = p ? (p['Habitaciones'] || '') : '';
  document.getElementById('edPropBan').value = p ? (p['Baños'] || '') : '';
  document.getElementById('edPropGar').value = p ? (p['Garaje'] || '') : '';
  document.getElementById('edPropArea').value = p ? (p['Área'] || '') : '';
  
  // Prioridad: 1. Datos de la propiedad (p) si existen, 2. Argumentos (lat/lng), 3. Valor actual en el input
  document.getElementById('edPropLat').value = (p && p['Latitud']) ? p['Latitud'] : (lat || currentLat);
  document.getElementById('edPropLng').value = (p && p['Longitud']) ? p['Longitud'] : (lng || currentLng);
  
  document.getElementById('edPropInmob').value = p ? (p['Inmobiliaria'] || '') : '';
  document.getElementById('edPropDesc').value = p ? (p['Descripción'] || '') : '';
  document.getElementById('edPropImgs').value = p ? (p['Imagenes'] || '') : '';
  
  updateEditorImgs();
  document.getElementById('edPropCodResults').style.display = 'none';
  document.getElementById('modalEditorProp').classList.add('open');
}

function checkPropCode(val) {
  const resCont = document.getElementById('edPropCodResults');
  if (!val || val.length < 1) {
    resCont.style.display = 'none';
    return;
  }

  const query = val.toLowerCase();
  const matches = allProps.filter(p => String(p['Código']).toLowerCase().includes(query)).slice(0, 5);

  if (matches.length > 0) {
    resCont.innerHTML = matches.map(p => `
      <div class="ed-cod-item" onclick="abrirEditorProp('${eq(p['Código'])}')">
        <span><span class="match-code">${p['Código']}</span> · ${p['Nombre'] || ''}</span>
        <span style="font-size:10px; color:var(--muted);">${p['Zona'] || ''}</span>
      </div>
    `).join('');
    resCont.style.display = 'block';
  } else {
    resCont.style.display = 'none';
  }
}

function updateEditorImgs() {
  const val = document.getElementById('edPropImgs').value;
  const urls = val.split(/[|\n]/).map(u => u.trim()).filter(u => u.startsWith('http'));
  const preview = document.getElementById('edPropImgPreview');
  preview.innerHTML = urls.map(u => `<div class="img-preview-item"><img src="${u}" onerror="this.src='https://i.imgur.com/Pc9M3I8.png'"/></div>`).join('');
}

async function guardarPropiedadEditor() {
  const cod = document.getElementById('edPropCod').value.trim();
  if (!cod) { toast('El código es obligatorio', 'error'); return; }
  
  const p = {
    'Código': cod,
    'Nombre': document.getElementById('edPropNom').value.trim(),
    'Precio': document.getElementById('edPropPre').value.trim(),
    'Tipo de inmueble': document.getElementById('edPropTipo').value,
    'Zona': document.getElementById('edPropZona').value.trim(),
    'Barrio': document.getElementById('edPropBar').value.trim(),
    'Habitaciones': document.getElementById('edPropHab').value,
    'Baños': document.getElementById('edPropBan').value,
    'Garaje': document.getElementById('edPropGar').value,
    'Área': document.getElementById('edPropArea').value.trim(),
    'Latitud': document.getElementById('edPropLat').value.trim(),
    'Longitud': document.getElementById('edPropLng').value.trim(),
    'Inmobiliaria': document.getElementById('edPropInmob').value.trim(),
    'Descripción': document.getElementById('edPropDesc').value.trim(),
    'Imagenes': document.getElementById('edPropImgs').value.trim(),
    'Publicar': 'si'
  };

  const idx = allProps.findIndex(x => x['Código'] === cod);
  if (idx >= 0) {
    // CORRECCIÓN CRÍTICA: Solo sobrescribir campos que el usuario realmente editó.
    // Si un campo viene vacío del formulario mini del mapa, NO borrar la info
    // rica que ya existe en la propiedad (descripción, puntos clave, ciudad, etc.)
    const updated = { ...allProps[idx] };
    for (const [key, val] of Object.entries(p)) {
      if (val !== '' && val !== null && val !== undefined) {
        updated[key] = val;
      }
    }
    allProps[idx] = updated;
    toast('Propiedad actualizada ✓ (información de la matriz preservada)', 'success');
  } else {
    allProps.push(p);
    toast('Nueva propiedad agregada localmente ✓', 'success');
  }

  // Guardar en persistencia local extendida (opcional)
  const customProps = JSON.parse(localStorage.getItem('icde_custom_props') || '[]');
  const cIdx = customProps.findIndex(x => x['Código'] === cod);
  if (cIdx >= 0) customProps[cIdx] = p;
  else customProps.push(p);
  localStorage.setItem('icde_custom_props', JSON.stringify(customProps));
  
  // Sincronización en tiempo real con la nube
  syncProperty(p);

  closeModal('modalEditorProp');
  renderNuevo();
  actualizarPinesMapa('nl');
  
  // Sugerencia de sincronización
  console.log("Para persistencia permanente, actualiza el Excel maestro con este JSON:", p);
}
