
// ── SISTEMA DE FAVORITOS ──
function getFavs() {
    try { return JSON.parse(localStorage.getItem('icde_favoritos') || '[]'); }
    catch(e) { return []; }
}
function saveFavs(arr) {
    localStorage.setItem('icde_favoritos', JSON.stringify(arr));
}

function toggleFav(cod) {
    let favs = getFavs();
    const idx = favs.indexOf(cod);
    if (idx > -1) {
        favs.splice(idx, 1);
    } else {
        favs.push(cod);
    }
    saveFavs(favs);
    // Actualizar botón corazón en la tarjeta
    document.querySelectorAll('.btn-fav[data-codigo="' + cod + '"]').forEach(function(btn) {
        btn.classList.toggle('active', favs.includes(cod));
    });
    renderFavPanel();
}

function renderFavPanel() {
    var favs = getFavs();
    var panel = document.getElementById('favPanel');
    var countEl = document.getElementById('favCount');
    var thumbsEl = document.getElementById('favThumbs');
    if (!panel) return;

    countEl.textContent = favs.length;

    if (favs.length === 0) {
        panel.classList.remove('visible');
        return;
    }

    panel.classList.add('visible');

    // Generar thumbnails
    var datosRef = (typeof listaFiltrada !== 'undefined' && listaFiltrada.length) ? datos : datos;
    thumbsEl.innerHTML = favs.map(function(cod) {
        var prop = datosRef.find(function(d) { return d['Código'] === cod; });
        if (!prop) return '';
        var imgs = (prop['Fotos'] || '').split(',');
        var thumb = imgs[0] ? imgs[0].trim() : '';
        var nombre = prop['Nombre'] || cod;
        return '<div class="fav-thumb" title="' + nombre + '" onclick="event.stopPropagation(); toggleFav(\'' + cod + '\')">' +
               (thumb ? '<img src="' + thumb + '" alt="' + nombre + '" loading="lazy"/>' : '<div style="width:100%;height:100%;background:#222;display:flex;align-items:center;justify-content:center;color:#d4a84b;font-size:11px">' + cod + '</div>') +
               '<span class="fav-thumb-remove">✕</span>' +
               '</div>';
    }).join('');
}

function clearAllFavs() {
    saveFavs([]);
    document.querySelectorAll('.btn-fav.active').forEach(function(btn) {
        btn.classList.remove('active');
    });
    renderFavPanel();
}

function agendarVisitaFavs() {
    var favs = getFavs();
    if (favs.length === 0) return;

    var datosRef = (typeof datos !== 'undefined') ? datos : [];
    var lineas = favs.map(function(cod) {
        var prop = datosRef.find(function(d) { return String(d['Código'] || '').trim() === String(cod).trim(); });
        if (!prop) return '• Código: ' + cod;
        var precio = prop['Precio'] || '';
        if (precio && typeof formatearPrecio === 'function') precio = formatearPrecio(precio);
        return '• ' + (prop['Nombre'] || 'Propiedad') + ' (Cód. ' + cod + ')' + (precio ? ' - ' + precio : '');
    });

    var catalogoURL = 'https://icdeinmobiliaria.com/?ids=' + favs.join(',');

    var objetoFavs = {
        esFavoritos: true,
        favs: favs,
        lineas: lineas,
        catalogoURL: catalogoURL
    };

    if (typeof abrirModalAgendarVisita === 'function') {
        abrirModalAgendarVisita(objetoFavs);
    }
}

// Inicializar panel al cargar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(renderFavPanel, 1500);
});
