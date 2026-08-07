
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwH_gsvmcm3iTu1uYXjqNHOch_1d9B4inUxijX8RszlVxnaWK3VVhrbHdeQZVS0U72t/exec';

let map, geojsonLayer, heatLayer, barrioPopup, resetDiv;
let superIndex = null, clusterMarkers = [], allPointFeatures = [];
let initialCenter = null, initialZoom = null;
let selectedFeature = null, selectedLayerRef = null;
let selectedCenter = null, selectedLabelMarker = null;
let barrioInfoWindow = null;
let heatmapLegendEl = null, toggleHeatEl = null, poiMarkers = [];

function initMap() {
    map = L.map('map', { center: [2.9389, -75.2803], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    initialCenter = map.getCenter();
    initialZoom   = map.getZoom();
    const ResetCtrl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd() {
            resetDiv = L.DomUtil.create('div', 'map-reset-btn');
            resetDiv.textContent = '\u2190 Ver todo el mapa';
            resetDiv.style.display = 'none';
            L.DomEvent.disableClickPropagation(resetDiv);
            L.DomEvent.on(resetDiv, 'click', ocultarPanel);
            return resetDiv;
        }
    });
    new ResetCtrl().addTo(map);
    cargarGeoJSONviaJSONP('barrios', 'handleBarrios');
    cargarGeoJSONviaJSONP('puntos',  'handlePuntos');
    mostrarPanel();

    // Show map message while loading
    var loadMsg = L.control({ position: 'bottomleft' });
    loadMsg.onAdd = function() {
        var d = L.DomUtil.create('div');
        d.id = 'map-load-msg';
        d.style.cssText = 'background:rgba(255,255,255,.85);padding:6px 12px;border-radius:6px;font-family:Outfit,sans-serif;font-size:12px;color:#555;box-shadow:0 2px 8px rgba(0,0,0,.2)';
        d.textContent = 'Cargando barrios...';
        return d;
    };
    loadMsg.addTo(map);
    window._loadMsg = loadMsg;

    // ── STREET VIEW CARD ────────────────────────────────────────────────────
    // Se crea dinámicamente y se inyecta en el contenedor del mapa para
    // garantizar posicionamiento correcto con z-index sobre todo lo de Leaflet.
    var svCard = document.createElement('div');
    svCard.id = 'sv-card';
    svCard.innerHTML =
        '<button class="sv-close" id="sv-close-btn">&times;</button>' +
        '<div class="sv-body">' +
          '<img class="sv-thumb" id="sv-thumb" src="" alt="Street View"/>' +
          '<div class="sv-info">' +
            '<div class="sv-name" id="sv-name">Cargando...</div>' +
            '<div class="sv-addr" id="sv-addr"></div>' +
            '<div class="sv-coords" id="sv-coords"></div>' +
          '</div>' +
        '</div>' +
        '<div class="sv-actions">' +
          '<a class="sv-btn-sv" id="sv-btn-sv" href="#" target="_blank" rel="noopener">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>' +
            ' Street View' +
          '</a>' +
          '<a class="sv-btn-dir" id="sv-btn-dir" href="#" target="_blank" rel="noopener" title="C\u00f3mo llegar">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>' +
          '</a>' +
          '<button class="sv-btn-share" id="sv-btn-share" title="Compartir">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>' +
          '</button>' +
        '</div>';
    map.getContainer().appendChild(svCard);

    // ── STREET VIEW CARD & MODAL 360 ──────────────────────────────────────────
    let currentSvLat = 2.941361, currentSvLng = -75.288196, currentSvName = 'Ubicación seleccionada';

    window.abrirStreetView360 = function(lat, lng, name) {
        const overlay = document.getElementById('svModalOverlay');
        const iframe = document.getElementById('svIframe');
        const title = document.getElementById('svModalName');
        const coords = document.getElementById('svModalCoords');
        const extBtn = document.getElementById('svModalExternalBtn');

        if (!overlay || !iframe) return;

        const latFmt = Number(lat).toFixed(6);
        const lngFmt = Number(lng).toFixed(6);

        if (title) title.textContent = name || 'Street View 360°';
        if (coords) coords.textContent = `(${latFmt}, ${lngFmt})`;
        if (extBtn) extBtn.href = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;

        iframe.src = `https://maps.google.com/maps?layer=c&cbll=${lat},${lng}&output=svembed`;
        overlay.style.display = 'flex';
    };

    window.cerrarStreetView360 = function() {
        const overlay = document.getElementById('svModalOverlay');
        const iframe = document.getElementById('svIframe');
        if (iframe) iframe.src = '';
        if (overlay) overlay.style.display = 'none';
    };

    document.getElementById('svModalOverlay')?.addEventListener('click', function(ev) {
        if (ev.target === this) cerrarStreetView360();
    });
    document.getElementById('svModalCloseBtn')?.addEventListener('click', cerrarStreetView360);

    var svCard = document.createElement('div');
    svCard.id = 'sv-card';
    svCard.innerHTML =
        '<button class="sv-close" id="sv-close-btn">&times;</button>' +
        '<div class="sv-body" id="sv-body-click" title="Abrir Street View 360°">' +
          '<div class="sv-thumb-box">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="#c9973a"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>' +
            '<span style="font-size:10px; font-weight:700; color:#c9973a; margin-top:2px;">360°</span>' +
          '</div>' +
          '<div class="sv-info">' +
            '<div class="sv-name" id="sv-name">Cargando...</div>' +
            '<div class="sv-addr" id="sv-addr"></div>' +
            '<div class="sv-coords" id="sv-coords"></div>' +
          '</div>' +
        '</div>' +
        '<div class="sv-actions">' +
          '<button class="sv-btn-sv" id="sv-btn-sv" type="button">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>' +
            ' Street View 360°' +
          '</button>' +
          '<a class="sv-btn-dir" id="sv-btn-dir" href="#" target="_blank" rel="noopener" title="Cómo llegar">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>' +
          '</a>' +
          '<button class="sv-btn-share" id="sv-btn-share" title="Compartir">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>' +
          '</button>' +
        '</div>';
    map.getContainer().appendChild(svCard);

    document.getElementById('sv-close-btn').addEventListener('click', function(ev) {
        ev.stopPropagation();
        svCard.style.display = 'none';
    });

    document.getElementById('sv-btn-sv').addEventListener('click', function(ev) {
        ev.stopPropagation();
        abrirStreetView360(currentSvLat, currentSvLng, currentSvName);
    });

    document.getElementById('sv-body-click').addEventListener('click', function(ev) {
        ev.stopPropagation();
        abrirStreetView360(currentSvLat, currentSvLng, currentSvName);
    });

    document.getElementById('sv-btn-share').addEventListener('click', function(ev) {
        ev.stopPropagation();
        var coords = document.getElementById('sv-coords').textContent;
        if (navigator.clipboard) navigator.clipboard.writeText(coords);
        this.title = '¡Copiado!';
        var btn = this;
        setTimeout(function(){ btn.title = 'Compartir'; }, 1500);
    });

    // ── Listener de click en el mapa ──
    map.getContainer().addEventListener('click', function(ev) {
        if (svCard.contains(ev.target)) return;
        if (ev.target.closest('.leaflet-control-container')) return;

        var containerPoint = map.mouseEventToContainerPoint(ev);
        var latlng = map.containerPointToLatLng(containerPoint);
        var lat = latlng.lat, lng = latlng.lng;
        var latFmt = lat.toFixed(6), lngFmt = lng.toFixed(6);

        currentSvLat = lat;
        currentSvLng = lng;
        currentSvName = 'Ubicación seleccionada';

        document.getElementById('sv-name').textContent   = 'Cargando...';
        document.getElementById('sv-addr').textContent   = '';
        document.getElementById('sv-coords').textContent = latFmt + ', ' + lngFmt;

        var dirUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
        document.getElementById('sv-btn-dir').href = dirUrl;

        svCard.style.display = 'block';

        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&addressdetails=1&accept-language=es')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var addr = data.address || {};
                var name = addr.road || addr.pedestrian || addr.neighbourhood ||
                           addr.suburb || addr.city_district || addr.city || 'Ubicación';
                var parts = [
                    addr.suburb || addr.neighbourhood || addr.city_district,
                    addr.city   || addr.town || addr.village
                ].filter(Boolean);
                currentSvName = name;
                document.getElementById('sv-name').textContent = name;
                document.getElementById('sv-addr').textContent = parts.join(', ');
            })
            .catch(function() {
                currentSvName = 'Ubicación seleccionada';
                document.getElementById('sv-name').textContent = currentSvName;
            });
    });
}

function handleBarrios(data) {
    if (window._loadMsg) { map.removeControl(window._loadMsg); window._loadMsg = null; }
    if (data.error) { console.error('Error barrios:', data.error); return; }
    geojsonLayer = L.geoJSON(data, {
        style: estiloBarrio,
        onEachFeature(feature, layer) {
            layer.on('click', () => seleccionarBarrio(feature, layer));
            layer.on('mouseover', function() {
                if (selectedFeature !== feature) this.setStyle({ fillOpacity: 0.55, weight: 2.5 });
            });
            layer.on('mouseout', function() {
                if (selectedFeature !== feature) geojsonLayer.resetStyle(this);
            });
        }
    }).addTo(map);
    createLayerControls();
}

function estiloBarrio(feature) {
    const props = feature.properties || {};
    const sel = selectedFeature && (selectedFeature.properties || {}).name === props.name;
    if (sel) return { fillColor: '#c88b30', fillOpacity: 0.75, color: '#be8939', weight: 2.5 };
    const fc = { 1: '#e74c3c', 2: '#f1c40f', 3: '#2ecc71' }[Number(props.estrato)] || '#3498db';
    return { fillColor: fc, fillOpacity: 0.3, color: fc, weight: 1.5 };
}

function refreshBarrioStyles() {
    if (geojsonLayer) geojsonLayer.eachLayer(l => l.setStyle(estiloBarrio(l.feature)));
}

function handlePuntos(data) { allPointFeatures = data.features || data; /* clusters desactivados */ }

function drawClusters() { /* clusters desactivados */ }

function seleccionarBarrio(feature, layer) {
    if (barrioPopup) { map.closePopup(barrioPopup); barrioPopup = null; }
    if (selectedLabelMarker) { map.removeLayer(selectedLabelMarker); selectedLabelMarker = null; }
    selectedFeature  = feature;
    selectedLayerRef = layer;
    refreshBarrioStyles();
    layer.setStyle({ fillColor: '#c88b30', fillOpacity: 0.75, color: '#be8939', weight: 2.5 });
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    selectedCenter = layer.getBounds().getCenter();
    const barrioName = ((feature.properties || {}).name || '').trim();
    if (barrioName) {
        selectedLabelMarker = L.marker(selectedCenter, {
            icon: L.divIcon({
                html: '<div style="position:relative;left:50%;transform:translateX(-50%);width:max-content;font:700 11px/1 Outfit,sans-serif;color:#fff;text-shadow:0 1px 5px rgba(0,0,0,1),0 0 10px rgba(0,0,0,0.8);white-space:nowrap;letter-spacing:1.5px;pointer-events:none;text-align:center">' + barrioName.toUpperCase() + '</div>',
                className: '', iconSize: [0,0], iconAnchor: [0, 0]
            }), interactive: false, zIndexOffset: 1000
        }).addTo(map);
    }
    mostrarPanel();
    document.getElementById('panel-contenido').innerHTML =
        '<div style="padding:32px;text-align:center">' +
        '<div style="display:inline-block;width:36px;height:36px;border:3px solid rgba(190,137,57,.2);border-top-color:#be8939;border-radius:50%;animation:spin .8s linear infinite"></div>' +
        '<p style="color:#888;font-size:13px;margin-top:12px">Cargando ' + barrioName + '...</p>' +
        '</div>';
    cargarInfoBarrioJSONP(barrioName);
    if (resetDiv) resetDiv.style.display = '';
}

function mostrarPanel() {
    const panel = document.getElementById('panel-lateral');
    const btn   = document.getElementById('panel-close-btn');
    if (panel) panel.style.display = '';
    if (btn) btn.style.display = selectedFeature ? '' : 'none';
    if (!selectedFeature) mostrarInstrucciones();
}

function ocultarPanel() {
    selectedFeature = null; selectedLayerRef = null;
    refreshBarrioStyles();
    if (selectedLabelMarker) { map.removeLayer(selectedLabelMarker); selectedLabelMarker = null; }
    if (barrioPopup) { map.closePopup(barrioPopup); barrioPopup = null; }
    if (initialCenter) map.setView([initialCenter.lat, initialCenter.lng], initialZoom);
    mostrarInstrucciones();
    const btn = document.getElementById('panel-close-btn');
    if (btn) btn.style.display = 'none';
    if (resetDiv) resetDiv.style.display = 'none';
}

function abrirPopupBarrio(htmlIW) {
    if (barrioPopup) { map.closePopup(barrioPopup); barrioPopup = null; }
    if (!selectedCenter) return;
    barrioPopup = L.popup({ maxWidth: 360, minWidth: 340, maxHeight: 480, autoPan: true, autoPanPadding: [20, 80], closeButton: false, offset: L.point(0, 10) })
        .setLatLng(selectedCenter).setContent(htmlIW).openOn(map);
    setTimeout(function() {
        var btn = document.querySelector('.iw-close-btn');
        if (btn) btn.addEventListener('click', function() { map.closePopup(barrioPopup); barrioPopup = null; });
    }, 100);
}

function zoomToFeature() {
    if (selectedLayerRef) map.fitBounds(selectedLayerRef.getBounds(), { padding: [20, 20] });
}
function highlightPOIsInFeature() {}

function createLayerControls() {
    var Ctrl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function() {
            var div = L.DomUtil.create('div', 'layer-controls');
            L.DomEvent.disableClickPropagation(div);
            toggleHeatEl = document.createElement('input');
            toggleHeatEl.type = 'checkbox'; toggleHeatEl.id = 'toggleHeat';
            var lbl = document.createElement('label');
            lbl.htmlFor = 'toggleHeat'; lbl.textContent = 'Heatmap precios';
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:6px;';
            row.appendChild(toggleHeatEl); row.appendChild(lbl);
            heatmapLegendEl = document.createElement('div');
            heatmapLegendEl.style.display = 'none';
            heatmapLegendEl.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;margin-top:6px;gap:2px"><span style="font-size:9px;color:#ff6060">Alto</span><div style="width:12px;height:80px;background:linear-gradient(to bottom,#d50000,#ff6d00,#ffd600,#aeea00,#00c853);border-radius:4px"></div><span style="font-size:9px;color:#00c853">Bajo</span></div>';
            div.appendChild(row); div.appendChild(heatmapLegendEl);
            toggleHeatEl.addEventListener('change', function() {
                if (this.checked) {
                    // Extract raw prices from point names
                    var rawPts = allPointFeatures
                        .filter(function(f) { return f.geometry && f.geometry.coordinates; })
                        .map(function(f) {
                            var coords = f.geometry.coordinates;
                            var name = ((f.properties || {}).name || '');
                            // Match prices like $63mlls, $1200mlls, $500m
                            var m = name.match(/\$([\d\.]+)\s*m/i);
                            var precio = m ? parseFloat(m[1]) : null;
                            return { lat: coords[1], lng: coords[0], precio: precio };
                        })
                        .filter(function(p) { return p.precio !== null; });

                    // Normalize 0-1: low price = 0 (green), high price = 1 (red)
                    var precios = rawPts.map(function(p) { return p.precio; });
                    var minP = Math.min.apply(null, precios);
                    var maxP = Math.max.apply(null, precios);
                    var rango = maxP - minP || 1;

                    var pts = rawPts.map(function(p) {
                        var intensity = (p.precio - minP) / rango; // 0=barato(verde), 1=caro(rojo)
                        return [p.lat, p.lng, intensity];
                    });

                    if (heatLayer) map.removeLayer(heatLayer);
                    heatLayer = L.heatLayer(pts, {
                        radius: 28,
                        blur: 22,
                        maxZoom: 17,
                        max: 1.0,
                        gradient: {
                            '0.0': '#00c853',  // verde: más barato
                            '0.25': '#aeea00', // amarillo-verde
                            '0.5':  '#ffd600', // amarillo
                            '0.75': '#ff6d00', // naranja
                            '1.0':  '#d50000'  // rojo: más caro
                        }
                    }).addTo(map);
                    heatmapLegendEl.style.display = 'block';
                } else {
                    if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
                    heatmapLegendEl.style.display = 'none';
                }
            });
            return div;
        }
    });
    new Ctrl().addTo(map);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('panel-close-btn').addEventListener('click', ocultarPanel);
    document.querySelector('#modalOverlay .modal-close').addEventListener('click', cerrarModal);
    var overlay = document.getElementById('modalOverlay');
    overlay.addEventListener('click', function(e) { if (e.target === overlay) cerrarModal(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') cerrarModal(); });
    initMap();
});

        function cargarGeoJSONviaJSONP(tipo, callbackName) {
            const prevId = 'jsonp-' + tipo;
            const prev = document.getElementById(prevId);
            if (prev) prev.remove();

            // First try fetch to diagnose any error from Apps Script
            const url = APPSCRIPT_URL
                + '?tipo=' + encodeURIComponent(tipo)
                + '&callback=' + encodeURIComponent(callbackName)
                + '&t=' + Date.now();

            fetch(url)
                .then(r => r.text())
                .then(text => {
                    console.log('[JSONP fetch test] tipo=' + tipo, 'status ok, first 200 chars:', text.slice(0, 200));
                    // If response looks like JSONP callback, eval it
                    if (text.trim().startsWith(callbackName + '(')) {
                        try { eval(text); return; } catch(e) { console.error('eval error', e); }
                    }
                    // Otherwise inject as script tag
                    const script = document.createElement('script');
                    script.id = prevId;
                    script.src = url;
                    script.onerror = () => console.error('Script tag error para', tipo);
                    document.body.appendChild(script);
                })
                .catch(err => {
                    console.error('[JSONP fetch FAILED] tipo=' + tipo, err.message);
                    // Fallback: try script tag anyway (may work with CORS mode = no-cors equiv)
                    const script = document.createElement('script');
                    script.id = prevId;
                    script.src = url;
                    script.onerror = () => console.error('Fallback script tag también falló para', tipo);
                    document.body.appendChild(script);
                });
        }

function cargarInfoBarrioJSONP(barrioName) {
            const callbackName = 'handleInfoBarrio';
            const url = APPSCRIPT_URL
                + '?tipo=infoBarrio'
                + '&barrioName=' + encodeURIComponent(barrioName)
                + '&callback=' + encodeURIComponent(callbackName)
                + '&t=' + Date.now();

            fetch(url)
                .then(r => r.text())
                .then(text => {
                    if (text.trim().startsWith(callbackName + '(')) {
                        try { eval(text); return; } catch(e) {
                            console.error('eval error infoBarrio', e);
                        }
                    }
                    // Fallback script tag
                    const script = document.createElement('script');
                    script.src = url;
                    script.onerror = () => {
                        console.error('Error cargando JSONP infoBarrio para', barrioName);
                        document.getElementById('panel-contenido').innerHTML =
                            '<div style="padding:24px;color:#f87171;font-size:13px">Error cargando información de ' + barrioName + '.</div>';
                    };
                    document.body.appendChild(script);
                })
                .catch(err => {
                    console.error('fetch infoBarrio failed', err);
                    const script = document.createElement('script');
                    script.src = url;
                    script.onerror = () => {
                        document.getElementById('panel-contenido').innerHTML =
                            '<div style="padding:24px;color:#f87171;font-size:13px">Error cargando información de ' + barrioName + '.</div>';
                    };
                    document.body.appendChild(script);
                });
        }

        function groupThousands(s) {
            let result = '';
            let i = s.length;
            while (i > 3) {
                const start = i - 3;
                const part = s.slice(start, i);
                result = '.' + part + result;
                i -= 3;
            }
            // Ahora i <= 3, los dígitos restantes al inicio:
            result = s.slice(0, i) + result;
            return result;
        }

        function formatPrice(num) {
            if (num == null || isNaN(num)) return '';
            const n = Math.round(Number(num));
            const abs = Math.abs(n);
            const s = String(abs);
            const len = s.length;
            let formatted;

            if (len > 6) {

                const millonesPart = s.slice(0, len - 6);
                const milesPart = s.slice(len - 6, len - 3);
                const unidadesPart = s.slice(len - 3);


                const millonesStr = groupThousands(millonesPart);

                formatted = millonesStr + "'" + milesPart + "." + unidadesPart;
            } else if (len > 3) {

                const milesPart = s.slice(0, len - 3);
                const unidadesPart = s.slice(len - 3);
                formatted = milesPart + "." + unidadesPart;
            } else {
                // Menor de 1000
                formatted = s;
            }

            // Anteponer signo y símbolo $
            return (n < 0 ? '-' : '') + '$' + formatted;
        }

        function formatNombreTitle(str) {
            if (!str) return '';
            let s = String(str).trim();
            if (s === s.toUpperCase() && s.length > 3) {
                s = s.toLowerCase();
                s = s.charAt(0).toUpperCase() + s.slice(1);
                const properNouns = ["Las Granjas", "San Pedro", "San Juan", "Plaza", "Neiva", "Norte", "Sur", "Oriente", "Occidente", "Huila"];
                properNouns.forEach(function(pn) {
                    const regex = new RegExp('\\b' + pn.replace(' ', '\\s+') + '\\b', 'gi');
                    s = s.replace(regex, pn);
                });
            }
            return s;
        }

        function formatInteger(num) {
            if (num == null || isNaN(num)) return '';
            return String(Math.round(Number(num)));
        }

        function formatArea(num) {
            if (num == null || isNaN(num)) return '';
            // Convertir a número y formatear con 2 decimales (usando separador decimal según locale)
            const n = Number(num);
            // Podemos usar locale 'en-US' para punto decimal: ej. 200.50
            const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return formatted + ' m²';
        }

        function generarCardInmuebleMinimal(item, index) {
            console.log('DEBUG generarCardInmuebleMinimal, item:', item);
            const codigo = item.Codigo || '';
            const publicar = String(item['Publicar'] || '').trim().toUpperCase();
            const cardId = 'card-mob-' + codigo + '-' + (index || 0);

            let html = `<div class="card-inmueble-minimal"
                       data-codigo="${codigo}"
                       data-publicar="${publicar}"
                       style="
                         border-radius:6px; overflow:hidden;
                         display:flex; flex-direction:column; background:#262525; color:#ccc;
                       ">`;

            html += generarCardCarruselHTML(item, cardId, 140);

            html += `<div class="card-info-minimal" style="padding:8px; display:flex; flex-direction:column; justify-content: space-between;">`;
            if (item.Nombre) {
                html += `<p class="card-nombre-minimal" style="margin:0; font-size:16px; font-weight:500; color:#fff;">
                        ${formatNombreTitle(item.Nombre)}
                     </p>`;
            }
            if (item.Precio != null) {
                html += `<p class="card-precio-minimal" style="margin:4px 0 0 0; font-size:14px; color:#22c55e; font-weight:bold;">
                        ${formatPrice(item.Precio)}
                     </p>`;
            }

            html += `<button class="btn-ver-mas" style="
                        margin-top:8px; align-self:flex-start;
                        padding:4px 8px; font-size:12px;
                        background:#444; border:none; border-radius:4px; color:#ccc; cursor:pointer;">
                    Ver más
                 </button>`;

            html += `<div class="card-etiquetas-extra" style="display:none; margin-top:8px; font-size:12px; color:#ccc;">`;

            if (item.Habitaciones != null) html += `<span class="etiqueta"><img src="https://i.imgur.com/ykKdGwE.png" class="icono-etiqueta" alt="Habitaciones"/>Hab ${item.Habitaciones}</span>`;
            if (item.Baños != null) html += `<span class="etiqueta"><img src="https://i.imgur.com/h9NqA32.png" class="icono-etiqueta" alt="Baños"/>Baños ${item.Baños}</span>`;
            if (item.Garaje != null) html += `<span class="etiqueta"><img src="https://i.imgur.com/4Yixa77.png" class="icono-etiqueta" alt="Garaje"/>Garaje ${item.Garaje}</span>`;
            if (item.Cocina != null) html += `<span class="etiqueta"><img src="https://i.imgur.com/rH6cXMa.png" class="icono-etiqueta" alt="Cocina"/>Cocina ${item.Cocina}</span>`;
            if (item.Pisos != null) html += `<span class="etiqueta"><img src="https://i.imgur.com/rz72lGC.png" class="icono-etiqueta" alt="Área"/>Pisos ${item.Pisos}</span>`;
            if (item["Área lote"] != null) html += `<span class="etiqueta"><img src="https://i.imgur.com/rz72lGC.png" class="icono-etiqueta" alt="Área"/>Lote ${item["Área lote"]} m²</span>`;

            html += `</div>`;
            html += `</div>`;
            html += `</div>`;
            return html;
        }

        function handleInfoBarrio(response) {

            const panelElem = document.getElementById('panel-contenido');
            const inmuebles = Array.isArray(response.inmuebles) ? response.inmuebles : [];
            let filteredList = inmuebles.slice();
            let currentPage = 1;
            const pageSize = 12;

            let filteredListDesk = inmuebles.slice();
            let currentPageDesk = 1;
            const pageSizeDesk = 12;
            let currentSortDesk = 'none';
            let currentSortMob = 'none';

            function aplicarOrdenamientoDesk(lista) {
                if (!lista || !lista.length) return lista;
                if (currentSortDesk === 'mayorPrecio') {
                    lista.sort((a, b) => (Number(b.Precio)||0) - (Number(a.Precio)||0));
                } else if (currentSortDesk === 'menorPrecio') {
                    lista.sort((a, b) => (Number(a.Precio)||0) - (Number(b.Precio)||0));
                } else if (currentSortDesk === 'mejorRentabilidad') {
                    const conv = v => { const m = typeof v==='string'?v.match(/(\d+)/):null; return m?parseInt(m[1]):Infinity; };
                    lista.sort((a, b) => conv(a.RetornoInversion) - conv(b.RetornoInversion));
                }
                return lista;
            }

            function aplicarOrdenamientoMob(lista) {
                if (!lista || !lista.length) return lista;
                if (currentSortMob === 'mayorPrecio') {
                    lista.sort((a, b) => (Number(b.Precio)||0) - (Number(a.Precio)||0));
                } else if (currentSortMob === 'menorPrecio') {
                    lista.sort((a, b) => (Number(a.Precio)||0) - (Number(b.Precio)||0));
                } else if (currentSortMob === 'mejorRentabilidad') {
                    const conv = v => { const m = typeof v==='string'?v.match(/(\d+)/):null; return m?parseInt(m[1]):Infinity; };
                    lista.sort((a, b) => conv(a.RetornoInversion) - conv(b.RetornoInversion));
                }
                return lista;
            }

            function renderMobilePage(shouldScroll = false) {
                const grid = panelElem.querySelector('#grid-inmuebles-mobile');
                const paginationContainer = panelElem.querySelector('#pagination-mobile');
                if (!grid || !paginationContainer) return;

                // Paginación
                const totalItems = filteredList.length;
                const totalPages = Math.ceil(totalItems / pageSize) || 1;
                if (currentPage > totalPages) currentPage = totalPages;
                if (currentPage < 1) currentPage = 1;
                const start = (currentPage - 1) * pageSize;
                const end = start + pageSize;
                const pageItems = filteredList.slice(start, end);

                // Render tarjetas
                grid.innerHTML = '';
                pageItems.forEach((item, idx) => {
                    grid.innerHTML += generarCardInmuebleMinimal(item, idx);
                });
                // Enganchar “Ver más”
                attachVerMasListenersMinimal();
                // Enganchar click para abrir modal
                attachCardClickListenersMinimal(pageItems);
                // Scroll solo al cambiar página
                if (shouldScroll) {
                    const anchor = document.getElementById('scroll-anchor');
                    if (anchor) {
                        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }

                // Paginación
                paginationContainer.innerHTML = '';

                const prevBtn = document.createElement('button');
                prevBtn.textContent = 'Anterior';
                prevBtn.disabled = (currentPage <= 1);
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderMobilePage(true);
                        attachVerMasListenersMinimal();
                    }
                });

                const nextBtn = document.createElement('button');
                nextBtn.textContent = 'Siguiente';
                nextBtn.disabled = (currentPage >= totalPages);
                nextBtn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderMobilePage(true);
                        attachVerMasListenersMinimal();
                    }
                });

                const pageInfo = document.createElement('span');
                pageInfo.textContent = `Página ${currentPage} / ${totalPages}`;
                pageInfo.style.color = '#ccc';

                paginationContainer.appendChild(prevBtn);
                paginationContainer.appendChild(pageInfo);
                paginationContainer.appendChild(nextBtn);
            }

            function renderDesktopPage(shouldScroll = false) {
                console.log('🔍 DEBUG renderDesktopPage llamado. currentPageDesk=', currentPageDesk,
                                   'filteredListDesk.length=', filteredListDesk.length,
                                   'shouldScroll=', shouldScroll);
                const grid = panelElem.querySelector('#grid-inmuebles-desk');
                const paginationContainer = panelElem.querySelector('#pagination-desk');
                if (!grid || !paginationContainer) return;

                // 1) Cálculo de paginación
                const totalItems = filteredListDesk.length;
                const totalPages = Math.ceil(totalItems / pageSizeDesk) || 1;
                if (currentPageDesk > totalPages) currentPageDesk = totalPages;
                if (currentPageDesk < 1) currentPageDesk = 1;
                const start = (currentPageDesk - 1) * pageSizeDesk;
                const end = start + pageSizeDesk;
                const pageItems = filteredListDesk.slice(start, end);

                // 2) Render de tarjetas en el grid
                grid.innerHTML = '';
                pageItems.forEach((item, idx) => {
                    grid.innerHTML += generarCardInmuebleHTML(item, idx);
                });
                attachCardClickListeners(pageItems);
                // 3) Solo hacer scroll al inicio del grid cuando shouldScroll===true
                if (shouldScroll) {
                    // Usamos grid.scrollIntoView, o si prefieres, desplazar el contenedor panel:
                    // grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // O bien, si el scroll real es en #panel-lateral o #panel-contenido:
                    // document.getElementById('panel-lateral').scrollTo({ top: 0, behavior: 'smooth' });
                    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                // 4) Construir la paginación: botones “Anterior” y “Siguiente”
                paginationContainer.innerHTML = '';

                const prevBtn = document.createElement('button');
                prevBtn.textContent = 'Anterior';
                prevBtn.style.padding = '4px 8px';
                prevBtn.style.marginRight = '8px';
                prevBtn.disabled = (currentPageDesk <= 1);
                prevBtn.addEventListener('click', (evt) => {
                    evt.preventDefault();
                    if (currentPageDesk > 1) {
                        currentPageDesk--;
                        renderDesktopPage(true);  // al paginar, sí hacemos scroll
                    }
                });
                paginationContainer.appendChild(prevBtn);

                const pageInfo = document.createElement('span');
                pageInfo.textContent = ` Página ${currentPageDesk} / ${totalPages} `;
                pageInfo.style.color = '#ccc';
                paginationContainer.appendChild(pageInfo);

                const nextBtn = document.createElement('button');
                nextBtn.textContent = 'Siguiente';
                nextBtn.style.padding = '4px 8px';
                nextBtn.style.marginLeft = '8px';
                nextBtn.disabled = (currentPageDesk >= totalPages);
                nextBtn.addEventListener('click', (evt) => {
                    evt.preventDefault();
                    if (currentPageDesk < totalPages) {
                        currentPageDesk++;
                        renderDesktopPage(true);  // al paginar, sí hacemos scroll
                    }
                });
                paginationContainer.appendChild(nextBtn);
            }
            console.log('handleInfoBarrio invocado, response:', response);
            try {
                const panelElem = document.getElementById('panel-contenido');
                const panelLateral = document.getElementById('panel-lateral');
                if (!panelElem || !panelLateral) {
                    console.error('handleInfoBarrio: no existe panel-contenido o panel-lateral');
                    return;
                }

                // Validaciones iniciales
                if (!response) {
                    panelElem.innerHTML =
                        `<h2 style="color:#ccc; text-align:center;">Error</h2>
                             <p style="color:#ccc; text-align:center;">Respuesta vacía del servidor.</p>`;
                    return;
                }
                if (response.error) {
                    panelElem.innerHTML =
                        `<h2 style="color:#ccc; text-align:center;">Error</h2>
                             <p style="color:#ccc; text-align:center;">${response.error}</p>`;
                    return;
                }

                // Extraer datos
                const barrioName = response.barrioName || 'Barrio';
                const general = response.general || {};
                const amenidades = Array.isArray(response.amenidades) ? response.amenidades : [];
                const resumen = response.resumenInmuebles || {};
                const inmuebles = Array.isArray(response.inmuebles) ? response.inmuebles : [];

                // Construcción de HTML base: título + línea dorada
                let htmlPanel = '';
                htmlPanel +=
                    `<div class="panel-titulo" style="text-align:center; margin:8px 0;">
                            <h2 style="margin:0; font-size:20px; letter-spacing:6px; text-transform:uppercase; color:#ccc;">
                                ${barrioName}
                            </h2>
                        </div>
                        <div class="modal-comparar-linea"></div>`;

                // Detectar móvil vs escritorio
                const esMovil = window.innerWidth <= 768;

                if (esMovil) {
                    // ======== VERSIÓN MÓVIL ========
                    htmlPanel += `<div class="tabs-container" style="display:flex; flex-direction:column; height:100%;">`;

                    // Header de pestañas: Inmuebles + Información adicional
                    htmlPanel += `<div class="tabs-header" style="
                                            display:flex; overflow-x:auto; border-bottom:1px solid #444;
                                            position:sticky; top:0; background-color:#212121; z-index:10;
                                        ">`;
                    htmlPanel += `<button class="tab-btn active" data-tab="inmuebles">Inmuebles</button>`;
                    htmlPanel += `<button class="tab-btn" data-tab="info">Información adicional</button>`;
                    htmlPanel += `</div>`; // cierre tabs-header

                    // Contenido de pestañas
                    htmlPanel += `<div class="tabs-content" style="padding:8px 0;">`;

                    // --- TAB Inmuebles ---
                    htmlPanel += `<div class="tab-content active" id="tab-inmuebles">`;
                    if (inmuebles.length === 0) {
                        htmlPanel += `<p style="font-size:12px; color:#ccc; text-align:center;">No hay inmuebles para mostrar.</p>`;
                    } else {
                        // Total + filtros móvil
                        const totalInmueblesMobile = (resumen.totalInmuebles != null)
                            ? resumen.totalInmuebles
                            : inmuebles.length;
                        htmlPanel += `<div id="seccion-filtros-mobile" style="margin:8px 0;">`;
                        htmlPanel += `<h3 style="
                                                text-align:center;
                                                padding:6px;
                                                background:#1d1d1d;
                                                border-radius:20px;
                                                color:#ccc;
                                                font-size:14px;
                                            ">
                                            Total de inmuebles: <span style="color:#9f7b45; font-size:20px">${totalInmueblesMobile}</span>
                                          </h3>`;
                        htmlPanel += `<div id="filtros-tipos-mobile" style="
                                                display:flex;
                                                flex-wrap:wrap;
                                                gap:6px;
                                                justify-content:center;
                                                margin-top:4px;
                                            ">`;
                        // Botón "Todos los inmuebles" al inicio
                        htmlPanel += `<button type="button" class="btn-filtro-tipo-mobile active" data-tipo="all">
                                                Todos los inmuebles (${inmuebles.length})
                                          </button>`;
                        const countsMobile = resumen.countsByTipo || {};
                        Object.keys(countsMobile).forEach(tipo => {
                            const count = countsMobile[tipo];
                            htmlPanel += `<button type="button" class="btn-filtro-tipo-mobile" data-tipo="${tipo}">
                                                    ${tipo} (${count})
                                              </button>`;
                        });
                        htmlPanel += `</div></div>`; // cierra filtros-tipos-mobile y seccion-filtros-mobile
                        htmlPanel += `<div id="scroll-anchor" style="height:1px; scroll-margin-top:50px;"></div>`;;
                        // Contenedor para grid y paginación
                        htmlPanel += `<div id="ordenamiento-container" style="margin-bottom:13px; margin-top: 13px; text-align:right;">
     <div class="sort-wrap">
    <button class="sort-toggle-btn" id="sortToggleMob">Ordenar por <span class="arrow">▾</span></button>
    <ul class="sort-dropdown" id="sortDropdownMob">
      <li data-val="mayorPrecio">Mayor precio</li>
      <li data-val="menorPrecio">Menor precio</li>
      <li data-val="mejorRentabilidad">Mayor rentabilidad</li>
    </ul>
  </div>
</div><div id="grid-inmuebles-mobile" class="grid-inmuebles" style="margin-top:8px;"></div>`;
                        htmlPanel += `<div id="pagination-mobile" style="display:flex; justify-content:center; align-items:center; margin:8px 0;"></div>`;
                    }
                    htmlPanel += `</div>`; // cierre tab-inmuebles

                    // --- TAB Información adicional ---
                    htmlPanel += `<div class="tab-content" id="tab-info">`;
                    // Amenidades
                    htmlPanel += `<section id="galeria-amenidades"><h3 style="color:#ccc; font-size:16px; margin:8px 0; text-align:center;">Sitios representativos</h3>
                                      <div class="modal-comparar-linea"></div><div class="galeria-grid">`;
                    if (amenidades.length === 0) {
                        htmlPanel += `<p style="font-size:12px; color:#ccc; text-align:center; width:100%;">Sin amenidades registradas.</p>`;
                    } else {
                        amenidades.forEach(item => {
                            const nombre = item.nombre || '';
                            const link = item.link || '#';
                            const fotoUrl = item.fotoUrl || '';
                            htmlPanel += `<div class="amenidad-item">
                                                  <a href="${link}" target="_blank" title="${nombre}">
                                                    <img src="${fotoUrl}" alt="${nombre}" class="amenidad-img" />
                                                    <p class="amenidad-nombre">${nombre}</p>
                                                  </a>
                                              </div>`;
                        });
                    }
                    htmlPanel += `</div></section>`;

                    // Promedios
                    htmlPanel += `<section id="seccion-promedios"><h3 style="color:#ccc; font-size:16px; margin:8px 0; text-align:center;">Promedios y métricas</h3>
                                     <div class="modal-comparar-linea"></div> <div class="promedios-grid">`;
                    if (general.precioMasBajo != null && general.precioMasBajo !== '') {
                        htmlPanel += `<div class="promedio-item"><span class="promedio-label">Precio más bajo</span>
                                             <span class="promedio-valor">${formatPrice(general.precioMasBajo)}</span></div>`;
                    }
                    if (general.precioPromedio != null && general.precioPromedio !== '') {
                        htmlPanel += `<div class="promedio-item"><span class="promedio-label">Precio promedio</span>
                                             <span class="promedio-valor">${formatPrice(general.precioPromedio)}</span></div>`;
                    }
                    if (general.habitacionesPromedio != null && general.habitacionesPromedio !== '') {
                        htmlPanel += `<div class="promedio-item"><span class="promedio-label">Habitaciones promedio</span>
                                             <span class="promedio-valor">${formatInteger(general.habitacionesPromedio)}</span></div>`;
                    }
                    if (general.banosPromedio != null && general.banosPromedio !== '') {
                        htmlPanel += `<div class="promedio-item"><span class="promedio-label">Baños promedio</span>
                                             <span class="promedio-valor">${formatInteger(general.banosPromedio)}</span></div>`;
                    }
                    if (general.areaPromedio != null && general.areaPromedio !== '') {
                        htmlPanel += `<div class="promedio-item"><span class="promedio-label">Área promedio</span>
                                             <span class="promedio-valor">${formatArea(general.areaPromedio)}</span></div>`;
                    }
                    if (general.estrato != null && general.estrato !== '') {
                        htmlPanel += `<div class="promedio-item"><span class="promedio-label">Estrato</span>
                                             <span class="promedio-valor">${formatInteger(general.estrato)}</span></div>`;
                    }
                    htmlPanel += `</div></section>`;
                    htmlPanel += `</div>`; // cierre tab-info

                    htmlPanel += `</div>`; // cierre tabs-content
                    htmlPanel += `</div>`; // cierre tabs-container

                    // Insertar HTML en panel
                    panelElem.innerHTML = htmlPanel;
                    // === INICIO: Asociar listener al select de “Ordenar por” === 🟢
                    // Asociar listener al “Ordenar por”
                    // Sort dropdown mobile
                        let currentSortMob = 'none';
                        const sortToggleMob = panelElem ? panelElem.querySelector('#sortToggleMob') : document.getElementById('sortToggleMob');
                        const sortDropdownMob = panelElem ? panelElem.querySelector('#sortDropdownMob') : document.getElementById('sortDropdownMob');
                        if (sortToggleMob && sortDropdownMob) {
                            sortToggleMob.addEventListener('click', function(e) {
                                e.stopPropagation();
                                sortToggleMob.classList.toggle('open');
                                sortDropdownMob.classList.toggle('open');
                            });
                            sortDropdownMob.querySelectorAll('li').forEach(function(li) {
                                li.addEventListener('click', function() {
                                    sortDropdownMob.querySelectorAll('li').forEach(function(x){x.classList.remove('selected')});
                                    li.classList.add('selected');
                                    sortToggleMob.childNodes[0].textContent = li.textContent + ' ';
                                    sortToggleMob.classList.remove('open');
                                    sortDropdownMob.classList.remove('open');
                                    currentSortMob = li.dataset.val;
                                    aplicarOrdenamientoMob(filteredList);
                                    currentPage = 1;
                                    renderMobilePage();
                                    });
                        });
                    }

                    // Render inicial
                    if (window.innerWidth <= 768) renderMobilePage(false);
                    else renderDesktopPage(false);
                    // === FIN: Asociar listener === 🟢


                    // Listeners pestañas móvil
                    const tabButtons = panelElem.querySelectorAll('.tab-btn');
                    tabButtons.forEach(btn => {
                        btn.addEventListener('click', () => {
                            tabButtons.forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            const tab = btn.getAttribute('data-tab');
                            panelElem.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                            const sel = panelElem.querySelector('#tab-' + tab);
                            if (sel) sel.classList.add('active');
                        });
                    });

                    // Paginación y filtros en móvil
                    if (inmuebles.length > 0) {
                        let currentPage = 1;
                        const pageSize = 12;
                        
                        // 🟢 INICIO: Aplicar ordenamiento según selector
                            filteredList.sort((a, b) => convertirAnios(a.RetornoInversion) - convertirAnios(b.RetornoInversion));
                        }
                        // 🟢 FIN: Ordenamiento





                        const filtroBtnsMobile = panelElem.querySelectorAll('.btn-filtro-tipo-mobile');
                        filtroBtnsMobile.forEach(btn => {
                            btn.addEventListener('click', function () {
                                filtroBtnsMobile.forEach(b => b.classList.remove('active'));
                                this.classList.add('active');
                                const tipoSel = this.getAttribute('data-tipo');
                                if (tipoSel === 'all') {
                                    filteredList = inmuebles.slice();
                                } else {
                                    filteredList = inmuebles.filter(item => item.TipoDeInmueble === tipoSel);
                                }
                                currentPage = 1;
                                renderMobilePage();

                            });
                        });

                        // Render inicial móvil
                        renderMobilePage();
                        attachVerMasListenersMinimal();
                    }

                    // No abrir InfoWindow en móvil; cerrar si existía
                    if (barrioPopup) { map.closePopup(barrioPopup); barrioPopup = null; }

                } else {
                    // ======== VERSIÓN DESKTOP ========
                    panelLateral.style.overflow = '';

                    // Variables paginación escritorio
                    let currentPageDesk = 1;
                    const pageSizeDesk = 12;
                    
                    // 🟢 INICIO: Aplicar ordenamiento según selector
                    const criterioOrdenDesk = document.getElementById('ordenarSelect')?.value || 'ninguno';
                    if (criterioOrdenDesk === 'mayorPrecio') {
                        filteredListDesk.sort((a, b) => b.Precio - a.Precio);
                    } else if (criterioOrdenDesk === 'menorPrecio') {
                        filteredListDesk.sort((a, b) => a.Precio - b.Precio);
                    } else if (criterioOrdenDesk === 'mejorRentabilidad') {
                        const convertirAnios = val => {
                            const m = typeof val === 'string' ? val.match(/(\d+)/) : null;
                            return m ? parseInt(m[1]) : Infinity;
                        };
                        filteredListDesk.sort((a, b) => convertirAnios(a.RetornoInversion) - convertirAnios(b.RetornoInversion));
                    }
                    // 🟢 FIN: Ordenamiento
                    // Construir HTML escritorio
                    let htmlDesk = '';

                    // Totales y filtros escritorio
                    const totalInmueblesDesk = (resumen.totalInmuebles != null)
                        ? resumen.totalInmuebles
                        : inmuebles.length;
                    const countsDesk = resumen.countsByTipo || {};
                    htmlDesk += `<section id="seccion-filtros">
                            <h3 style="
                                 text-align:center;
                                 padding:10px;
                                 background:#1d1d1d;
                                 border-radius:52px;
                                 color:#ccc;
                             ">
                                 Total de inmuebles: <span style="color:#9f7b45; font-size:20px;">${totalInmueblesDesk}</span>
                             </h3>
                             <div id="filtros-tipos-desk" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:12px;">`;

                    // Botón “Todos los inmuebles”
                    htmlDesk += `<button type="button" class="btn-filtro-tipo active" data-tipo="all">
                                         Todos los inmuebles (${inmuebles.length})
                                     </button>`;

                    // Botones por tipo
                    Object.keys(countsDesk).forEach(tipo => {
                        const count = countsDesk[tipo];
                        htmlDesk += `<button type="button" class="btn-filtro-tipo" data-tipo="${tipo}">
                                             ${tipo} (${count})
                                          </button>`;
                    });
                    htmlDesk += `</div></section>`;

                    // Lista paginada escritorio
                    htmlDesk += `<section id="seccion-inmuebles">
                    <div id="ordenamiento-container" style="margin-bottom:16px; text-align:right;">
     <div class="sort-wrap">
    <button class="sort-toggle-btn" id="sortToggleDesk">Ordenar por <span class="arrow">▾</span></button>
    <ul class="sort-dropdown" id="sortDropdownDesk">
      <li data-val="mayorPrecio">Mayor precio</li>
      <li data-val="menorPrecio">Menor precio</li>
      <li data-val="mejorRentabilidad">Mayor rentabilidad</li>
    </ul>
  </div>
</div>
                                    <h3 style="color:#ccc;">Lista de inmuebles</h3>
                                    <div id="grid-inmuebles-desk" class="grid-inmuebles" style="margin-top:8px;"></div>
                                    <div id="pagination-desk" style="display:flex; justify-content:center; align-items:center; margin:8px 0;"></div>
                                </section>`;

                    // Insertar HTML escritorio
                    panelElem.innerHTML = htmlPanel + htmlDesk;

                    // 🔥 Listener “Ordenar por” escritorio  (¡MANTÉN SOLO ESTE!)
                        // Sort dropdown desktop
                        const sortToggleDesk = panelElem.querySelector('#sortToggleDesk');
                        const sortDropdownDesk = panelElem.querySelector('#sortDropdownDesk');
                        if (sortToggleDesk && sortDropdownDesk) {
                            sortToggleDesk.addEventListener('click', function(e) {
                                e.stopPropagation();
                                sortToggleDesk.classList.toggle('open');
                                sortDropdownDesk.classList.toggle('open');
                            });
                            sortDropdownDesk.querySelectorAll('li').forEach(function(li) {
                                li.addEventListener('click', function() {
                                    sortDropdownDesk.querySelectorAll('li').forEach(function(x){x.classList.remove('selected')});
                                    li.classList.add('selected');
                                    const label = li.textContent;
                                    sortToggleDesk.childNodes[0].textContent = label + ' ';
                                    sortToggleDesk.classList.remove('open');
                                    sortDropdownDesk.classList.remove('open');
                                    currentSortDesk = li.dataset.val;
                                    aplicarOrdenamientoDesk(filteredListDesk);
                                    currentPageDesk = 1;
                                    renderDesktopPage(false);
                                });
                            });
                            document.addEventListener('click', function() {
                                sortToggleDesk.classList.remove('open');
                                sortDropdownDesk.classList.remove('open');
                            });
                        }

                    // Función para renderizar página escritorio
                    

                    // === Llamada inicial (al abrir barrio) sin scroll ===
                    // Asegúrate de inicializar antes estas variables en el mismo scope:
                    currentPageDesk = 1;
                    filteredListDesk = inmuebles.slice();  // o tu lista base
                    renderDesktopPage(false);  // false: no hace scroll en la carga inicial

                    // === Listeners de filtros escritorio ===
                    // Cuando el usuario cambie el filtro, restablecemos paginación y sí hacemos scroll.
                    panelElem.querySelectorAll('.btn-filtro-tipo').forEach(btn => {
                        btn.addEventListener('click', evt => {
                            evt.preventDefault();
                            // Marcar activo
                            panelElem.querySelectorAll('.btn-filtro-tipo').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            // Filtrar lista
                            const tipoSel = btn.getAttribute('data-tipo');
                            if (tipoSel === 'all') {
                                filteredListDesk = inmuebles.slice();
                            } else {
                                filteredListDesk = inmuebles.filter(item => (item.TipoDeInmueble || '').trim() === tipoSel.trim());
                            }
                            aplicarOrdenamientoDesk(filteredListDesk);
                            currentPageDesk = 1;
                            renderDesktopPage(true); // true: sí hace scroll al cambiar filtro
                        });
                    });
                    

                    // InfoWindow en escritorio
                    if (selectedCenter) {
                        if (barrioPopup) { map.closePopup(barrioPopup); barrioPopup = null; }
                        // Construir contenido InfoWindow
                        let htmlIW = `<div class="iw-content">
  <div class="iw-header">
    <h2 style="margin:0;font-size:15px;color:#222;font-weight:700">${barrioName}</h2>
    <button class="iw-close-btn" aria-label="Cerrar">&times;</button>
  </div>
  <div class="iw-comparar-linea"></div>`;

                        // Amenidades — solo si tienen nombre y foto
                        const amenValidas = amenidades.filter(a => a.nombre && a.fotoUrl);
                        if (amenValidas.length > 0) {
                            htmlIW += `<div style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin:6px 0 4px">Lugares cercanos</div>`;
                            htmlIW += `<div class="iw-galeria-grid">`;
                            amenValidas.forEach(a => {
                                const link = a.link || '#';
                                htmlIW += `<div class="iw-amenidad-item">
                                  <a href="${link}" target="_blank" rel="noopener">
                                    <img class="iw-amenidad-img" src="${a.fotoUrl}" alt="${a.nombre}" loading="lazy" onerror="this.parentElement.parentElement.style.display='none'">
                                    <div class="iw-amenidad-nombre">${a.nombre}</div>
                                  </a>
                                </div>`;
                            });
                            htmlIW += `</div>`;
                        }

                        // Promedios
                        const pBajo   = general.precioMasBajo   ? formatPrice(general.precioMasBajo)   : '—';
                        const pProm   = general.precioPromedio   ? formatPrice(general.precioPromedio)   : '—';
                        const hProm   = general.habitacionesPromedio ? Math.round(general.habitacionesPromedio) : '—';
                        const bProm   = general.banosPromedio    ? Math.round(general.banosPromedio)    : '—';
                        const aProm   = general.areaPromedio     ? formatArea(general.areaPromedio)     : '—';
                        const estrato = general.estrato          ? general.estrato                      : '—';

                        htmlIW += `<div style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin:8px 0 4px">Promedios</div>`;
                        htmlIW += `<div class="iw-promedios-grid">
                          <div class="iw-promedio-item"><span class="iw-promedio-label">Precio más bajo</span><span class="iw-promedio-valor">${pBajo}</span></div>
                          <div class="iw-promedio-item"><span class="iw-promedio-label">Precio promedio</span><span class="iw-promedio-valor">${pProm}</span></div>
                          <div class="iw-promedio-item"><span class="iw-promedio-label">Habitaciones</span><span class="iw-promedio-valor">${hProm}</span></div>
                          <div class="iw-promedio-item"><span class="iw-promedio-label">Baños</span><span class="iw-promedio-valor">${bProm}</span></div>
                          <div class="iw-promedio-item"><span class="iw-promedio-label">Área promedio</span><span class="iw-promedio-valor">${aProm}</span></div>
                          <div class="iw-promedio-item"><span class="iw-promedio-label">Estrato</span><span class="iw-promedio-valor">${estrato}</span></div>
                        </div>
                        </div>`;

                        abrirPopupBarrio(htmlIW);
                        // Attach close button listener after popup opens
                        setTimeout(() => {
                            const closeBtn = document.querySelector('.iw-close-btn');
                            if (closeBtn) {
                                closeBtn.onclick = null;
                                closeBtn.addEventListener('click', () => {
                                    if (barrioPopup) { map.closePopup(barrioPopup); barrioPopup = null; }
                                });
                            }
                        }, 100);
                    }

                }
            } catch (err) {
                console.error('Excepción en handleInfoBarrio:', err);
                const panelElem = document.getElementById('panel-contenido');
                if (panelElem) {
                    panelElem.innerHTML = `<h2 style="color:#ccc; text-align:center;">Error interno</h2>
                                               <p style="color:#ccc; text-align:center;">Ocurrió un error al procesar la información del barrio.</p>`;
                }
            }
        }

        function obtenerFotosInmueble(item) {
            const publicar = String(item['Publicar'] || '').trim().toUpperCase();
            const HIGH_RES_LOGO = 'imagenes/logo_premium.png';

            const fotos = [];
            const rawImgs = item.Imagenes || item['Imagenes'] || item['imagenes'] || '';
            if (rawImgs) {
                rawImgs.replace(/\r/g, '').replace(/\n/g, '')
                    .split('|')
                    .map(function(u){ return u.trim(); })
                    .filter(function(u){ return u.length > 5 && !u.includes('AP1GczOda4rqkyNccBsE3o1UxlO'); })
                    .forEach(function(u){ fotos.push(u); });
            }

            if (!fotos.length && item.Image && !item.Image.includes('AP1GczOda4rqkyNccBsE3o1UxlO')) {
                fotos.push(item.Image);
            }

            if (publicar !== 'SI' || !fotos.length) {
                return [HIGH_RES_LOGO];
            }

            return fotos;
        }

        function generarCardCarruselHTML(item, cardId, heightPx) {
            const fotos = obtenerFotosInmueble(item);
            window.cardCarousels = window.cardCarousels || {};
            window.cardCarousels[cardId] = { fotos: fotos, idx: 0 };
            const h = heightPx || 175;

            let html = `<div class="carrusel-wrapper card-carrusel-wrapper" data-card-id="${cardId}">`;
            html += `<div class="carrusel-principal" style="height:${h}px;">`;

            fotos.forEach((url, i) => {
                const isLogo = url.includes('logo_premium');
                const imgStyle = isLogo ? 'width:100%; height:100%; object-fit:contain; background:#080808; padding:12px; box-sizing:border-box;' : '';
                html += `<div class="carrusel-slide ${i === 0 ? 'activa' : ''}">
                            <img src="${url}" alt="${item.Nombre || 'Inmueble'}" style="${imgStyle}" loading="${i === 0 ? 'eager' : 'lazy'}" draggable="false" />
                         </div>`;
            });

            if (fotos.length > 1) {
                html += `<span class="carrusel-counter">1 / ${fotos.length}</span>`;
                html += `<button type="button" class="carrusel-btn carrusel-prev" onclick="cardCarPrev(event, '${cardId}')">&#8249;</button>`;
                html += `<button type="button" class="carrusel-btn carrusel-next" onclick="cardCarNext(event, '${cardId}')">&#8250;</button>`;
            }

            html += `<button type="button" class="carrusel-expand" onclick="cardCarExpand(event, '${cardId}')" title="Ver galería">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                     </button>`;
            html += `</div>`;

            if (fotos.length > 1) {
                html += `<div class="carrusel-miniaturas">`;
                fotos.slice(0, 4).forEach((url, i) => {
                    html += `<img src="${url}" class="carrusel-min ${i === 0 ? 'activa' : ''}" onclick="cardCarGoTo(event, '${cardId}', ${i})" loading="lazy" alt="Miniatura ${i+1}" />`;
                });
                html += `</div>`;
            }

            html += `</div>`;
            return html;
        }

        function cardCarGoTo(evt, cardId, idx) {
            if (evt) { evt.preventDefault(); evt.stopPropagation(); }
            const data = (window.cardCarousels || {})[cardId];
            if (!data || !data.fotos || !data.fotos.length) return;
            const n = data.fotos.length;
            data.idx = ((idx % n) + n) % n;

            const cardWrap = document.querySelector(`[data-card-id="${cardId}"]`);
            if (!cardWrap) return;

            const slides = cardWrap.querySelectorAll('.carrusel-slide');
            slides.forEach((s, i) => s.classList.toggle('activa', i === data.idx));

            const counter = cardWrap.querySelector('.carrusel-counter');
            if (counter) counter.textContent = (data.idx + 1) + ' / ' + n;

            const minDiv = cardWrap.querySelector('.carrusel-miniaturas');
            if (minDiv && n > 1) {
                let start = Math.max(0, data.idx - 1);
                if (start + 4 > n) start = Math.max(0, n - 4);
                let minHtml = '';
                for (let i = start; i < start + 4 && i < n; i++) {
                    const activaClass = i === data.idx ? ' activa' : '';
                    minHtml += `<img src="${data.fotos[i]}" class="carrusel-min${activaClass}" onclick="cardCarGoTo(event, '${cardId}', ${i})" loading="lazy" alt="Miniatura ${i+1}"/>`;
                }
                minDiv.innerHTML = minHtml;
            }
        }

        function cardCarPrev(evt, cardId) {
            if (evt) { evt.preventDefault(); evt.stopPropagation(); }
            const data = (window.cardCarousels || {})[cardId];
            if (data) cardCarGoTo(evt, cardId, data.idx - 1);
        }

        function cardCarNext(evt, cardId) {
            if (evt) { evt.preventDefault(); evt.stopPropagation(); }
            const data = (window.cardCarousels || {})[cardId];
            if (data) cardCarGoTo(evt, cardId, data.idx + 1);
        }

        function cardCarExpand(evt, cardId) {
            if (evt) { evt.preventDefault(); evt.stopPropagation(); }
            const data = (window.cardCarousels || {})[cardId];
            if (data && data.fotos && data.fotos.length) {
                lbAbrir(data.fotos, data.idx);
            }
        }

        function filtrarInmueblesPorTipo(tipoSel, inmuebles) {
            const contenedor = document.getElementById('grid-inmuebles');
            contenedor.innerHTML = '';
            const filtrados = inmuebles.filter(item => item.TipoDeInmueble === tipoSel);
            if (filtrados.length === 0) {
                contenedor.innerHTML = '<p>No hay inmuebles de este tipo en el barrio.</p>';
                return;
            }
            filtrados.forEach((item, idx) => {
                contenedor.innerHTML += generarCardInmuebleHTML(item, idx);
            });
        }

        function generarCardInmuebleHTML(item, index) {
            const codigo = item.Codigo || '';
            const publicar = String(item['Publicar'] || '').trim().toUpperCase();
            const cardId = 'card-desk-' + codigo + '-' + (index || 0);

            let html = `<div class="card-inmueble"
                           data-codigo="${codigo}"
                           data-publicar="${publicar}">`;

            html += generarCardCarruselHTML(item, cardId, 175);

            html += `<div class="card-info">
                        <h4 class="card-nombre">${formatNombreTitle(item.Nombre)}</h4>
                        <p class="card-codigo">Código: ${codigo}</p>
                        <p class="card-precio">${formatPrice(item.Precio)}</p>
                        <div class="card-etiquetas">`;
            if (item.Habitaciones !== undefined && item.Habitaciones !== null) html += `<span class="etiqueta"><img src="https://i.imgur.com/ykKdGwE.png" class="icono-etiqueta" alt="Habitaciones"/>Hab ${item.Habitaciones}</span>`;
            if (item.Baños !== undefined && item.Baños !== null) html += `<span class="etiqueta"><img src="https://i.imgur.com/h9NqA32.png" class="icono-etiqueta" alt="Baños"/>Baños ${item.Baños}</span>`;
            if (item.Garaje !== undefined && item.Garaje !== null) html += `<span class="etiqueta"><img src="https://i.imgur.com/4Yixa77.png" class="icono-etiqueta" alt="Garaje"/>Garaje ${item.Garaje}</span>`;
            if (item.Cocina !== undefined && item.Cocina !== null) html += `<span class="etiqueta"><img src="https://i.imgur.com/rH6cXMa.png" class="icono-etiqueta" alt="Cocina"/>Cocina ${item.Cocina}</span>`;
            if (item.Pisos !== undefined && item.Pisos !== null) html += `<span class="etiqueta"><img src="https://i.imgur.com/rz72lGC.png" class="icono-etiqueta" alt="Área"/>Pisos ${item.Pisos}</span>`;
            if (item["Área lote"] !== undefined && item["Área lote"] !== null) html += `<span class="etiqueta"><img src="https://i.imgur.com/rz72lGC.png" class="icono-etiqueta" alt="Área"/>Lote ${item["Área lote"]} m²</span>`;
            html += `   </div>
                     </div>`;
            html += `</div>`;
            return html;
        }

        function mostrarInstrucciones() {
            const panelElem = document.getElementById('panel-contenido');
            if (!panelElem) return;
            // (Opcional) console.log para depurar:
            
            const html = `
              <div id="panel-instrucciones" style="padding: 24px 20px 20px; color: #ccc; font-family: 'Outfit', sans-serif;">
                <h2 style="font-size: 15px; color: #be8939; text-align: center; margin-bottom: 8px; margin-top: 0px; letter-spacing: 3px; font-weight: 600;">INVENTARIO POR SECTORES</h2>
                <div style="width: 100%; height: 2px; background: #be8939; margin-bottom: 16px;"></div>
                <div style="margin-bottom: 20px;">
                  <iframe
                  class="mi-video"
                    width="90%"
                    height="300"
                    src="https://www.youtube.com/embed/WQM2qBT7Krs?vq=hd2160"
                    frameborder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    style="display: block; margin: 0 auto; background: #000;">
                  </iframe>
                </div>
                <h3 style="font-size: 14px; color: #aaa; margin-bottom: 16px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Cómo explorar el mapa</h3>
                <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                  <img src="https://i.imgur.com/krqM7do.png" alt="Icono mapa" style="width: 27px;height: 27px;margin-right: 10px;margin-top: 3px;">
                  <div>
                    <ag>1. Haz clic en el barrio</a><br>

                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                  <img src="https://i.imgur.com/uCNDu4n.png" alt="Icono inmueble" style="width: 27px;height: 27px;margin-right: 10px;margin-top: 1px;">
                  <div>
                    <a>2. Elige tipo de inmueble</a><br>

                  </div>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <img src="https://i.imgur.com/SHrjTyY.png" alt="Icono explorar" style="width: 27px;height: 27px;margin-right: 10px;margin-top: 3px;">
                  <div>
                    <a>3. Navega y explora las propiedades</a><br>

                  </div>
                </div>
              </div>
`;
            panelElem.innerHTML = html;
        }

        function compartirInmueble(codigo) {
            const url = window.location.origin + window.location.pathname + '?codigo=' + encodeURIComponent(codigo);
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(function() {
                    alert('¡Enlace del inmueble ' + codigo + ' copiado al portapapeles!');
                }).catch(function() {
                    prompt('Copia este enlace para compartir:', url);
                });
            } else {
                prompt('Copia este enlace para compartir:', url);
            }
        }

        function toggleCompararInmueble(codigo, checked) {
            console.log('Comparar inmueble:', codigo, checked);
        }

        function abrirModalDirecto(item) {
            const contentDiv = document.getElementById('modalContent');
            if (!contentDiv) return;

            const codigo = item.Codigo || '';
            const waNumber = '573208762117';
            const mensaje = `Hola, quiero agendar una visita para ver el inmueble ${codigo}`;
            const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(mensaje)}`;

            const ciudad = item.Ciudad || 'Neiva';
            const zona = item.Zona || 'Norte';
            const estrato = item.Estrato != null && item.Estrato !== '' ? item.Estrato : '3';
            const ubicacion = item.Ubicación || item.Ubicacion || 'Medianera';
            const piscina = item.Piscina != null && item.Piscina !== '' ? item.Piscina : 'No tiene';
            
            let areaConst = item["Área Construida"] || item.AreaConstruida || item["Área construida"] || '';
            if (areaConst && !String(areaConst).includes('m²') && areaConst !== 'No aplica') {
                areaConst = areaConst + ' m²';
            }
            if (!areaConst) areaConst = 'No aplica';

            const admin = item.Administración || item.Administracion || 'No aplica';
            const retorno = item["Retorno de la Inversión"] || item.RetornoInversion || item.Rentabilidad || 'No aplica';

            const tableRows = `
              <tr><td>Ciudad</td><td>${ciudad}</td></tr>
              <tr><td>Zona</td><td>${zona}</td></tr>
              <tr><td>Estrato</td><td>${estrato}</td></tr>
              <tr><td>Ubicación</td><td>${ubicacion}</td></tr>
              <tr><td>Piscina</td><td>${piscina}</td></tr>
              <tr><td>Área construida</td><td>${areaConst}</td></tr>
              <tr><td>Administración</td><td>${admin}</td></tr>
              <tr><td>Retorno de la inversión</td><td>${retorno}</td></tr>
            `;

            let pillsHtml = '';
            if (item.Habitaciones != null) pillsHtml += `<span class="modal-pill"><img src="https://i.imgur.com/ykKdGwE.png" class="modal-pill-icon" alt="Habitaciones"/> Habitaciones ${item.Habitaciones}</span>`;
            if (item.Baños != null) pillsHtml += `<span class="modal-pill"><img src="https://i.imgur.com/h9NqA32.png" class="modal-pill-icon" alt="Baños"/> Baños ${item.Baños}</span>`;
            if (item.Garaje != null) pillsHtml += `<span class="modal-pill"><img src="https://i.imgur.com/4Yixa77.png" class="modal-pill-icon" alt="Garaje"/> Garaje ${item.Garaje}</span>`;
            if (item.Cocina != null) pillsHtml += `<span class="modal-pill"><img src="https://i.imgur.com/rH6cXMa.png" class="modal-pill-icon" alt="Cocina"/> Cocina ${item.Cocina}</span>`;
            if (item.Pisos != null) pillsHtml += `<span class="modal-pill"><img src="https://i.imgur.com/rz72lGC.png" class="modal-pill-icon" alt="Pisos"/> Pisos ${item.Pisos}</span>`;
            if (item["Área lote"] != null) pillsHtml += `<span class="modal-pill"><img src="https://i.imgur.com/rz72lGC.png" class="modal-pill-icon" alt="Lote"/> Lote ${item["Área lote"]} m²</span>`;
            if (item["Área Construida"] != null && item["Área lote"] == null) pillsHtml += `<span class="modal-pill"><img src="https://i.imgur.com/rz72lGC.png" class="modal-pill-icon" alt="Área"/> Área ${item["Área Construida"]} m²</span>`;

            let html = `
              <div class="modal-contenido">
                <div class="modal-columna-izq">
                  <div class="carrusel-wrapper">
                    <div class="carrusel-principal" id="modalCarrusel" style="height:260px;">
                      <button class="carrusel-btn carrusel-prev" id="modalCarPrev">&#8249;</button>
                      <button class="carrusel-btn carrusel-next" id="modalCarNext">&#8250;</button>
                      <span class="carrusel-counter" id="modalCarCounter">1 / 1</span>
                      <button class="carrusel-expand" id="modalCarExpand" title="Ver galería">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      </button>
                    </div>
                    <div class="carrusel-miniaturas" id="modalCarMins"></div>
                  </div>
                  
                  <div class="modal-bloque-info">
                    <h2 id="modalTitle">${formatNombreTitle(item.Nombre)}</h2>
                    <p class="modal-tipo-sub">${item["Tipo de inmueble"] || item.TipoDeInmueble || ''}</p>
                    <p class="modal-codigo-sub">Código: ${codigo}</p>
                    <p class="modal-precio-destacado">${formatPrice(item.Precio)}</p>
                    <div class="modal-pills-container">
                      ${pillsHtml}
                    </div>
                  </div>
                </div>

                <div class="modal-columna-der">
                  <div class="modal-section-header" style="margin-top:0;">
                    <span class="modal-subtitulo-gold">CARACTERÍSTICAS</span>
                    <div class="modal-gold-line"></div>
                  </div>
                  <table class="modal-tabla-caracteristicas">
                    ${tableRows}
                  </table>

                  <div class="modal-section-header">
                    <span class="modal-subtitulo-gold">PUNTOS CLAVE</span>
                    <div class="modal-gold-line"></div>
                  </div>
                  <p class="modal-texto">${item["PuntosClave"] || 'No especificados.'}</p>

                  <div class="modal-section-header">
                    <span class="modal-subtitulo-gold">DESCRIPCIÓN</span>
                    <div class="modal-gold-line"></div>
                  </div>
                  <p class="modal-texto">${item["Descripcion"] || 'Sin descripción disponible.'}</p>
                </div>
              </div>

              <div class="modal-footer-bar">
                <a id="modalBotonWhatsapp" href="${waLink}" target="_blank" class="boton-fotoswpp">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:2px"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                  Agendar visita por WhatsApp
                </a>
                <button type="button" class="btn-modal-compartir" onclick="compartirInmueble('${codigo}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Compartir
                </button>
              </div>
            `;
            contentDiv.innerHTML = html;

            // Init carousel with property images
            (function() {
                const fotos = obtenerFotosInmueble(item);
                requestAnimationFrame(function() {
                    carInit(fotos);
                    carWireControls();
                });
            })();

            // Mostrar overlay
            const overlay = document.getElementById('modalOverlay');
            if (overlay) overlay.style.display = 'flex';
        }

        function abrirModalExterno(item) {
            const contentDiv = document.getElementById('modalContent');
            if (!contentDiv) return;
            const codigo = item.Codigo || '';
            const waNumber = '573208762117';
            const mensaje = `Hola, estoy interesado en información del inmueble ${codigo}. Por favor, contáctenme.`;
            const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(mensaje)}`;
            let html = `
              <div style="text-align:center; color:#ccc;">
                <h2 style="color:#fff;">Información premium</h2>
                <p>Esta información es premium. Contáctanos por WhatsApp para más información.</p>
                <p><strong>Código:</strong> ${codigo}</p>
                <a id="modalBotonWhatsapp" href="${waLink}" target="_blank" class="boton-fotos">✆ Contactar por WhatsApp</a>
              </div>
            `;
            contentDiv.innerHTML = html;
            const overlay = document.getElementById('modalOverlay');
            if (overlay) overlay.style.display = 'flex';
        }

        function cerrarModal() {
            const overlay = document.getElementById('modalOverlay');
            if (overlay) overlay.style.display = 'none';
        }

        function attachCardClickListeners(inmuebles) {
            document.querySelectorAll('.card-inmueble').forEach(card => {
                const codigo = card.dataset.codigo;
                const publicar = (card.dataset.publicar || '').trim().toUpperCase();

                card.onclick = null;

                card.addEventListener('click', (e) => {
                    if (e.target.closest('.carrusel-btn') || e.target.closest('.carrusel-expand') || e.target.closest('.carrusel-miniaturas')) {
                        return;
                    }
                    const item = inmuebles.find(it => String(it.Codigo) === String(codigo));
                    if (!item) return;

                    if (publicar === 'SI') {
                        abrirModalDirecto(item);
                    } else {
                        abrirModalExterno(item);
                    }
                });
            });
        }

        function toggleVerMas(e) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.currentTarget;
            const card = btn.closest('.card-inmueble-minimal');
            const extra = card.querySelector('.card-etiquetas-extra');
            if (!extra) return;
            if (extra.style.display === 'block') {
                extra.style.display = 'none';
                btn.textContent = 'Ver más';
            } else {
                extra.style.display = 'block';
                btn.textContent = 'Ver menos';
            }
        }

        function attachVerMasListenersMinimal() {
            document.querySelectorAll('.card-inmueble-minimal .btn-ver-mas')
                .forEach(btn => {
                    btn.removeEventListener('click', toggleVerMas);
                    btn.addEventListener('click', toggleVerMas);
                });
        }

        function attachCardClickListenersMinimal(inmuebles) {
            document.querySelectorAll('.card-inmueble-minimal').forEach(card => {
                const codigo = card.dataset.codigo;
                const publicar = (card.dataset.publicar || '').trim().toUpperCase();

                card.onclick = (e) => {
                    if (e && (e.target.closest('.carrusel-btn') || e.target.closest('.carrusel-expand') || e.target.closest('.carrusel-miniaturas'))) {
                        return;
                    }
                    const item = inmuebles.find(it => String(it.Codigo) === String(codigo));
                    if (!item) return;

                    if (publicar === 'SI') {
                        abrirModalDirecto(item);
                    } else {
                        abrirModalExterno(item);
                    }
                };
            });
        }



        // ══════════════════════════════════════════
        // CARRUSEL + LIGHTBOX (modal photos)
        // ══════════════════════════════════════════
        var _carFotos = [], _carIdx = 0, _carTimer = null;
        var _lbFotos = [], _lbIdx = 0;
        const CAR_DELAY = 5000;

        function esVideo(url){ return url && url.startsWith('video:'); }
        function urlMedia(url){ return esVideo(url) ? url.slice(6) : url; }

        function carInit(fotos) {
            clearTimeout(_carTimer);
            _carFotos = fotos; _carIdx = 0;
            const el = document.getElementById('modalCarrusel');
            if (!el) return;
            // Remove old slides
            el.querySelectorAll('.carrusel-slide').forEach(s => s.remove());
            fotos.forEach(function(url, i) {
                const slide = document.createElement('div');
                slide.className = 'carrusel-slide' + (i === 0 ? ' activa' : '');
                if (esVideo(url)) {
                    const v = document.createElement('video');
                    v.src = urlMedia(url); v.controls = true; v.muted = true; v.playsInline = true;
                    v.style.cssText = 'width:100%;height:100%;object-fit:contain;';
                    slide.appendChild(v);
                } else {
                    const img = document.createElement('img');
                    img.src = url; img.draggable = false;
                    img.loading = i === 0 ? 'eager' : 'lazy';
                    img.alt = 'Foto ' + (i+1);
                    slide.appendChild(img);
                }
                el.insertBefore(slide, el.querySelector('.carrusel-prev'));
            });
            document.getElementById('modalCarCounter').textContent = '1 / ' + fotos.length;
            carUpdateMins();
            if (fotos.length > 1) carRestart();
        }

        function carIr(idx) {
            if (!_carFotos.length) return;
            _carIdx = ((idx % _carFotos.length) + _carFotos.length) % _carFotos.length;
            const el = document.getElementById('modalCarrusel');
            if (el) el.querySelectorAll('.carrusel-slide').forEach(function(s,i){ s.classList.toggle('activa', i === _carIdx); });
            const counter = document.getElementById('modalCarCounter');
            if (counter) counter.textContent = (_carIdx+1) + ' / ' + _carFotos.length;
            carUpdateMins();
            carRestart();
        }

        function carRestart() {
            clearTimeout(_carTimer);
            if (_carFotos.length > 1) _carTimer = setTimeout(function(){ carIr(_carIdx+1); }, CAR_DELAY);
        }

        function carUpdateMins() {
            const n = _carFotos.length;
            const minDiv = document.getElementById('modalCarMins');
            if (!minDiv) return;
            if (n <= 1) { minDiv.style.display = 'none'; return; }
            minDiv.style.display = 'grid';
            let start = Math.max(0, _carIdx - 1);
            if (start + 4 > n) start = Math.max(0, n - 4);
            const window4 = [];
            for (let i = start; i < start+4 && i < n; i++) window4.push(i);
            minDiv.innerHTML = '';
            window4.forEach(function(i) {
                const img = document.createElement('img');
                img.src = _carFotos[i];
                img.className = 'carrusel-min' + (i === _carIdx ? ' activa' : '');
                img.loading = 'lazy';
                img.addEventListener('click', function(){ carIr(i); });
                minDiv.appendChild(img);
            });
        }

        // Lightbox
        function lbAbrir(fotos, idx) {
            _lbFotos = fotos; _lbIdx = idx || 0;
            const mins = document.getElementById('lbMins');
            if (!mins) return;
            mins.innerHTML = '';
            fotos.forEach(function(url, i) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'position:relative;display:inline-block;cursor:pointer;';
                wrap.addEventListener('click', function(){ lbIr(i); });
                const img = document.createElement('img');
                img.src = urlMedia(url); img.className = 'lb-min'; img.loading = 'lazy';
                wrap.appendChild(img);
                if (esVideo(url)) {
                    const b = document.createElement('span');
                    b.textContent = '▶'; b.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:12px;pointer-events:none;';
                    wrap.appendChild(b);
                }
                mins.appendChild(wrap);
            });
            document.getElementById('lbOverlay').classList.add('activo');
            document.body.style.overflow = 'hidden';
            const btnClose = document.getElementById('lbClose');
            const btnPrev = document.getElementById('lbPrev');
            const btnNext = document.getElementById('lbNext');
            if (btnClose && !btnClose._b){ btnClose._b=true; btnClose.addEventListener('click', function(e){ e.stopPropagation(); lbCerrar(); }); }
            if (btnPrev && !btnPrev._b){ btnPrev._b=true; btnPrev.addEventListener('click', function(e){ e.stopPropagation(); lbIr(_lbIdx-1); }); }
            if (btnNext && !btnNext._b){ btnNext._b=true; btnNext.addEventListener('click', function(e){ e.stopPropagation(); lbIr(_lbIdx+1); }); }
            const ov = document.getElementById('lbOverlay');
            if (!ov._b){ ov._b=true; ov.addEventListener('click', function(e){ if(e.target===ov) lbCerrar(); }); }
            lbIr(_lbIdx);
        }

        function lbIr(idx) {
            if (!_lbFotos.length) return;
            _lbIdx = ((_lbIdx = idx, idx % _lbFotos.length) + _lbFotos.length) % _lbFotos.length;
            _lbIdx = ((idx % _lbFotos.length) + _lbFotos.length) % _lbFotos.length;
            const url = _lbFotos[_lbIdx];
            const wrap = document.querySelector('.lb-img-wrap');
            const oldVid = wrap ? wrap.querySelector('video') : null;
            if (oldVid) { oldVid.pause(); oldVid.remove(); }
            const lbImg = document.getElementById('lbImg');
            if (esVideo(url)) {
                if (lbImg) lbImg.style.display = 'none';
                const v = document.createElement('video');
                v.src = urlMedia(url); v.controls = true; v.autoplay = true; v.playsInline = true;
                v.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
                if (wrap) wrap.insertBefore(v, wrap.querySelector('.lb-btns'));
            } else {
                if (lbImg) { lbImg.style.display = ''; lbImg.src = url; }
            }
            const counter = document.getElementById('lbCounter');
            if (counter) counter.textContent = (_lbIdx+1) + ' / ' + _lbFotos.length;
            // Update min highlights
            const minsEl = document.getElementById('lbMins');
            if (minsEl) minsEl.querySelectorAll('.lb-min').forEach(function(img, i){ img.classList.toggle('activa', i === _lbIdx); });
        }

        function lbCerrar() {
            document.getElementById('lbOverlay').classList.remove('activo');
            document.body.style.overflow = '';
            const wrap = document.querySelector('.lb-img-wrap');
            const v = wrap ? wrap.querySelector('video') : null;
            if (v) { v.pause(); v.remove(); }
            const lbImg = document.getElementById('lbImg');
            if (lbImg) lbImg.style.display = '';
        }

        document.addEventListener('keydown', function(e){
            const lb = document.getElementById('lbOverlay');
            if (!lb || !lb.classList.contains('activo')) return;
            if (e.key === 'Escape') lbCerrar();
            if (e.key === 'ArrowRight') lbIr(_lbIdx+1);
            if (e.key === 'ArrowLeft') lbIr(_lbIdx-1);
        });

        // Wire carousel controls after modal opens
        function carWireControls() {
            const prev = document.getElementById('modalCarPrev');
            const next = document.getElementById('modalCarNext');
            const expand = document.getElementById('modalCarExpand');
            if (prev && !prev._wired) { prev._wired=true; prev.addEventListener('click', function(e){ e.stopPropagation(); carIr(_carIdx-1); }); }
            if (next && !next._wired) { next._wired=true; next.addEventListener('click', function(e){ e.stopPropagation(); carIr(_carIdx+1); }); }
            if (expand && !expand._wired) { expand._wired=true; expand.addEventListener('click', function(e){ e.stopPropagation(); lbAbrir(_carFotos, _carIdx); }); }
        }

        