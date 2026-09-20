
        (function () {

            /* Mapa: data-campo del filtro-nuevo → id del <select> oculto */
            const MAPA = {
                'Tipo de inmueble': 'filterTipoPropiedad',
                'Rango de precio': 'filterRangoPrecio',
                'Zona': 'filterZona',
                'Habitaciones': 'filterHabitaciones',
                'Garaje': 'filterGaraje',
                'Pisos': 'filterPisos',
            };

            const LABELS_DEFAULT = {
                'Tipo de inmueble': 'Tipo de inmueble',
                'Rango de precio': 'Precio',
                'Zona': 'Zona',
                'Habitaciones': 'Habitaciones',
                'Garaje': 'Garaje',
                'Pisos': 'Pisos',
            };

            /* Estado local de selecciones */
            const sel = {};
            Object.keys(MAPA).forEach(k => sel[k] = []);

            /* ── Poblar dropdowns con datos reales (se llama tras cargar datos) ── */
            function poblarDropdowns() {
                if (typeof datos === 'undefined' || !datos.length) {
                    setTimeout(poblarDropdowns, 300);
                    return;
                }
                Object.keys(MAPA).forEach(campo => {
                    // Solo el dropdown del desktop (dentro de .filtros-wrapper.solo-desktop)
                    const dropEl = document.querySelector(`.filtros-wrapper.solo-desktop .filtro-nuevo[data-campo="${campo}"] .filtro-nuevo-dropdown`);
                    if (!dropEl) return;

                    /* Obtener valores únicos ordenados */
                    let vals = [...new Set(datos.map(d => String(d[campo] ?? '')).filter(v => v && v !== 'undefined'))];
                    if (['Habitaciones', 'Garaje', 'Pisos'].includes(campo)) {
                        vals = vals.map(v => Number(v)).filter(v => !isNaN(v)).sort((a, b) => a - b).map(v => String(v));
                    } else {
                        vals = vals.sort();
                    }

                    dropEl.innerHTML = vals.map(v => {
                        const count = datos.filter(d => String(d[campo]) === v).length;
                        return `<div class="fn-option" data-val="${v}">
                                                <span class="fn-chk"></span>${v}<span class="fn-count">(${count})</span>
                                            </div>`;
                    }).join('');

                    /* Eventos en opciones */
                    dropEl.querySelectorAll('.fn-option').forEach(opt => {
                        opt.addEventListener('click', e => {
                            e.stopPropagation();
                            const val = opt.dataset.val;
                            if (opt.classList.contains('fn-selected')) {
                                opt.classList.remove('fn-selected');
                                opt.querySelector('.fn-chk').textContent = '';
                                sel[campo] = sel[campo].filter(v => v !== val);
                            } else {
                                opt.classList.add('fn-selected');
                                opt.querySelector('.fn-chk').textContent = '';
                                sel[campo] = [...sel[campo], val];
                            }
                            sincronizarSelect(campo);
                            renderHead(document.querySelector(`.filtros-wrapper.solo-desktop .filtro-nuevo[data-campo="${campo}"]`));
                            actualizarConteos();
                            refreshLimpiar();
                        });
                    });
                });
                actualizarConteos();
            }

            /* ── Sincronizar con el <select> oculto y disparar change ── */
            function sincronizarSelect(campo) {
                // Escribir directo en el objeto filtros global y aplicar
                const claveFiltro = {
                    'Tipo de inmueble': 'Tipo de inmueble',
                    'Rango de precio': 'Rango de precio',
                    'Zona': 'Zona',
                    'Habitaciones': 'Habitaciones',
                    'Garaje': 'Garaje',
                    'Pisos': 'Pisos',
                };
                const clave = claveFiltro[campo];
                if (clave) {
                    filtros[clave] = sel[campo].slice();
                    aplicarFiltros();
                }
            }

            /* ── Actualizar conteos correlacionales ── */
            function actualizarConteos() {
                if (typeof datos === 'undefined') return;

                Object.keys(MAPA).forEach(campo => {
                    /* Filtrar datos excluyendo este campo */
                    const subset = datos.filter(d => {
                        return Object.keys(MAPA).every(c => {
                            if (c === campo) return true;
                            if (!sel[c] || sel[c].length === 0) return true;
                            return sel[c].includes(String(d[c] ?? ''));
                        });
                    });

                    const dropEl = document.querySelector(`.filtros-wrapper.solo-desktop .filtro-nuevo[data-campo="${campo}"] .filtro-nuevo-dropdown`);
                    if (!dropEl) return;

                    dropEl.querySelectorAll('.fn-option').forEach(opt => {
                        const val = opt.dataset.val;
                        const count = subset.filter(d => String(d[campo] ?? '') === val).length;
                        const countEl = opt.querySelector('.fn-count');
                        if (countEl) countEl.textContent = `(${count})`;
                        opt.classList.toggle('fn-zero', count === 0 && !opt.classList.contains('fn-selected'));
                    });
                });
            }

            /* ── Renderizar cabecera ── */
            function renderHead(filtroEl) {
                const campo = filtroEl.dataset.campo;
                const vals = sel[campo] || [];
                const head = filtroEl.querySelector('.filtro-nuevo-head');
                const ico = filtroEl.querySelector('.fn-ico').outerHTML;
                const lbl = LABELS_DEFAULT[campo];

                if (vals.length === 0) {
                    head.innerHTML = `${ico}<span class="fn-lbl">${lbl}</span><span class="fn-arrow"></span>`;
                } else {
                    const tags = vals.slice(0, 3).map(v =>
                        `<span class="fn-tag">${v}<span class="fn-tag-x" data-campo="${campo}" data-val="${v}">✕</span></span>`
                    ).join('') + (vals.length > 3 ? `<span class="fn-tag">+${vals.length - 3}</span>` : '');
                    head.innerHTML = `${ico}<span class="fn-tags">${tags}</span><span class="fn-arrow"></span>`;
                }
            }

            /* ── Abrir / cerrar dropdown ── */
            function toggleFiltro(filtroEl) {
                const was = filtroEl.classList.contains('fn-open');
                document.querySelectorAll('.filtros-wrapper.solo-desktop .filtro-nuevo.fn-open').forEach(f => f.classList.remove('fn-open'));
                // Cerrar "Ordenar por" si está abierto
                const sortList = document.getElementById('sortOptions');
                if (sortList) sortList.classList.add('hidden');
                if (!was) filtroEl.classList.add('fn-open');
            }

            document.querySelectorAll('.filtros-wrapper.solo-desktop .filtro-nuevo-head').forEach(h => {
                h.addEventListener('click', e => {
                    if (e.target.closest('.fn-tag-x')) return;
                    toggleFiltro(h.closest('.filtro-nuevo'));
                });
            });

            /* Clic en ✕ de un tag */
            document.getElementById('filtrosBarNueva')?.addEventListener('click', e => {
                const x = e.target.closest('.fn-tag-x');
                if (!x) return;
                e.stopPropagation();
                const campo = x.dataset.campo, val = x.dataset.val;
                sel[campo] = sel[campo].filter(v => v !== val);
                const filtroEl = document.querySelector(`.filtros-wrapper.solo-desktop .filtro-nuevo[data-campo="${campo}"]`);
                filtroEl?.querySelectorAll('.fn-option').forEach(o => {
                    if (o.dataset.val === val) {
                        o.classList.remove('fn-selected');
                        const c = o.querySelector('.fn-chk'); if (c) c.textContent = '';
                    }
                });
                sincronizarSelect(campo);
                renderHead(filtroEl);
                actualizarConteos();
                refreshLimpiar();
            });

            /* Cerrar al clic fuera */
            document.addEventListener('click', e => {
                if (!e.target.closest('.filtro-nuevo'))
                    document.querySelectorAll('.filtro-nuevo.fn-open').forEach(f => f.classList.remove('fn-open'));
            });

            /* ── Input buscar nueva ── */
            document.getElementById('filterBuscarNueva')?.addEventListener('input', function () {
                filtros['Buscar'] = this.value.trim();
                aplicarFiltros();
                refreshLimpiar();
            });

            /* ── Botón limpiar nueva ── */
            const btnLimpiarNueva = document.getElementById('clearFiltersNueva');
            const movilLimpiarPill = document.getElementById('movilLimpiarPill');

            function anyActive() {
                const bVal = (document.getElementById('filterBuscarNueva')?.value || '').trim();
                if (bVal) return true;
                return Object.values(sel).some(v => v.length > 0);
            }
            function refreshLimpiar() {
                btnLimpiarNueva?.classList.toggle('fn-activo', anyActive());
            }

            btnLimpiarNueva?.addEventListener('click', () => {
                Object.keys(sel).forEach(k => sel[k] = []);
                document.querySelectorAll('.fn-option.fn-selected').forEach(o => {
                    o.classList.remove('fn-selected');
                    const c = o.querySelector('.fn-chk'); if (c) c.textContent = '';
                });
                document.querySelectorAll('.filtro-nuevo').forEach(f => renderHead(f));
                const bi = document.getElementById('filterBuscarNueva');
                if (bi) bi.value = '';
                filtros['Tipo de inmueble'] = [];
                filtros['Rango de precio'] = [];
                filtros['Zona'] = [];
                filtros['Habitaciones'] = [];
                filtros['Garaje'] = [];
                filtros['Pisos'] = [];
                filtros['Buscar'] = '';
                aplicarFiltros();
                actualizarConteos();
                refreshLimpiar();
            });

            /* ── Mostrar wrapper cuando los datos estén listos ── */
            function mostrarWrapper() {
                const wrapper = document.querySelector('.filtros-wrapper');
                if (wrapper) wrapper.style.opacity = '1';
            }

            /* Observar cuando .filtros pierda la clase hidden (el JS original la quita) */
            const observer = new MutationObserver(() => {
                poblarDropdowns();
                mostrarWrapper();
                actualizarConteos();
                if (typeof window._construirInline === 'function') window._construirInline();
            });
            const filtrosOcultos = document.querySelector('.filtros');
            if (filtrosOcultos) {
                observer.observe(filtrosOcultos, { attributes: true, attributeFilter: ['class'] });
            }

            /* También intentar poblar si los datos ya están al cargar */
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    poblarDropdowns();
                    if (typeof window._construirInline === 'function') window._construirInline();
                }, 800);
            });
            // Exponer para sincronización externa
            window._icdeFiltrosSync = {
                sel: sel,
                poblarDropdowns: poblarDropdowns,
                renderHead: renderHead,
                refreshLimpiar: refreshLimpiar,
                MAPA: MAPA,
                actualizarConteos: actualizarConteos
            };

        })();
    