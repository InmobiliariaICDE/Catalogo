
                    // ─────────────────────────────────────────────────
                    // 1. Variables globales y configuración inicial
                    // ─────────────────────────────────────────────────
                    const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/inmobiliariaicde/databases/(default)/documents/propiedades?pageSize=600";

                    let paginaActual = 1;
                    const tarjetasPorPagina = 32;
                    let datos = [];

                    const parsePrecio = txt => parseFloat((txt || "").toString().replace(/[^\d]/g, "")) || 0;

                    let filtros = {
                        "Tipo de inmueble": [],
                        "Rango de precio": [],
                        "Zona": [],
                        "Estrato": [],
                        "Habitaciones": [],
                        "Garaje": [],
                        "Pisos": [],
                        "Barrio": [],
                        "Conjunto": [],
                        "Ubicación": [],
                        "Piscina": [],
                        "Cocina": [],
                        "Buscar": "",
                        "minPrice": null,
                        "maxPrice": null,
                        "ids": []
                    };

                    let listaFiltrada = [];
                    let todosBarrios = [];
                    let todosConjuntos = [];
                    const choiceInstances = {};
                    let primeraCarga = true; // Para controlar el primer renderizado de tarjetas
                    let criterioOrden = "";  // "" | "menorPrecio" | "mayorPrecio" | "rentabilidad"

                    // ─────────────────────────────────────────────────
                    // 2. Función para cargar datos desde tu API
                    // ─────────────────────────────────────────────────
                    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxki98uXR_fXbFCPynfzvQN5ibiwQY23zKpLkLKTL7A26GlipdC20oQTKOrUwAMeIJ2gw/exec?action=getData";

                    function cargarDatos() {
                        try { localStorage.removeItem('icde_cached_datos'); } catch(e) {}
                        document.body.classList.add('cargando');

                        const urlApps = APPS_SCRIPT_URL + "&_t=" + Date.now();
                        fetch(urlApps, { cache: 'no-store' })
                            .then(res => {
                                if (!res.ok) throw new Error('HTTP Error ' + res.status);
                                return res.json();
                            })
                            .then(data => {
                                if (Array.isArray(data) && data.length > 0) {
                                    inicializar(data);
                                } else {
                                    throw new Error('Formato no válido desde Apps Script');
                                }
                            })
                            .catch(err => {
                                console.warn('Fallback a datos_catalogo.json:', err);
                                const liveUrl = 'datos_catalogo.json?_t=' + Date.now();
                                fetch(liveUrl, { cache: 'no-store' })
                                    .then(r => r.json())
                                    .then(data => inicializar(Array.isArray(data) ? data : []))
                                    .catch(e => {
                                        console.error("Error crítico al cargar datos:", e);
                                        document.body.classList.remove('cargando');
                                    });
                            });
                    }

                    function inicializar(data) {
                        console.log('Inicializando con', data.length, 'registros');
                        datos = data.filter(d => String(d['Publicar'] || '').trim().toUpperCase() === 'SI');

                        // Asegurarnos de que ciertos filtros sean arrays
                        filtros["Zona"] = filtros["Zona"] || [];
                        filtros["Barrio"] = filtros["Barrio"] || [];
                        filtros["Conjunto"] = filtros["Conjunto"] || [];

                        // ── PASO 0: Capturar y aplicar filtros desde URL ──
                        const params = new URLSearchParams(window.location.search);
                        const mapParams = {
                            'q': 'Buscar',
                            'tipo': 'Tipo de inmueble',
                            'precio': 'Rango de precio',
                            'zona': 'Zona',
                            'estrato': 'Estrato',
                            'hab': 'Habitaciones',
                            'garaje': 'Garaje',
                            'pisos': 'Pisos',
                            'barrio': 'Barrio',
                            'conjunto': 'Conjunto',
                            'ubicacion': 'Ubicación',
                            'piscina': 'Piscina',
                            'cocina': 'Cocina',
                            'orden': 'orden',
                            'min': 'minPrice',
                            'max': 'maxPrice',
                            'ids': 'ids'
                        };

                        let tieneFiltrosURL = false;
                        for (const [param, filtroKey] of Object.entries(mapParams)) {
                            let val = params.get(param);
                            if (val && val.trim() !== '') {
                                try { val = decodeURIComponent(val); } catch(e) {}
                                if (filtroKey === 'orden') {
                                    criterioOrden = val;
                                    const sortToggle = document.getElementById('sortToggle');
                                    if (sortToggle) {
                                        const options = { 'menorPrecio': 'Menor precio', 'mayorPrecio': 'Mayor precio', 'rentabilidad': 'Rentabilidad', 'destacadas': 'Propiedades destacadas' };
                                        if (options[val]) sortToggle.textContent = options[val] + ' ▼';
                                    }
                                } else if (filtroKey === 'Buscar') {
                                    filtros['Buscar'] = val;
                                    const input = document.getElementById('filterBuscarNueva') || document.getElementById('movilBuscar');
                                    if (input) input.value = val;
                                } else if (filtroKey === 'minPrice' || filtroKey === 'maxPrice') {
                                    filtros[filtroKey] = parseFloat(val);
                                } else {
                                    filtros[filtroKey] = val.split(',').map(v => v.trim());
                                }
                                tieneFiltrosURL = true;
                            }
                        }
                        if (tieneFiltrosURL) console.log('Filtros de URL aplicados correctamente:', filtros);

                        // ── PASO 1: Mostrar tarjetas filtradas INMEDIATAMENTE ──
                        document.body.classList.remove('cargando');
                        const sp = document.getElementById('cargandoSpinner');
                        if (sp) sp.style.display = 'none';
                        document.querySelectorAll('.precarga').forEach(el => el.classList.remove('precarga'));
                        const cw = document.getElementById("contadorWrapper");
                        if (cw) cw.style.display = "flex";
                        document.getElementById("contador")?.classList.remove("hidden");
                        document.getElementById("ordenar-por")?.classList.remove("hidden");
                        
                        aplicarFiltros();

                        if (tieneFiltrosURL) {
                            setTimeout(() => {
                                const tarjetas = document.getElementById('tarjetas');
                                if (tarjetas) tarjetas.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 500);
                        }
                        // Notificar que los datos ya están listos
                        window._icdeDatosListos = true;
                        window.dispatchEvent(new CustomEvent('icdeDatosListos'));
                        // SEO: si el usuario llegó desde Google a /propiedad/slug, abrir ese modal
                        setTimeout(abrirDesdeURL, 150);

                        // ── PASO 2: Inicializar filtros y Choices en segundo plano ──
                        setTimeout(() => {
                            // 3.1. Poblar los <select> iniciales con TODOS los registros
                            llenarOpcionesFiltros();
                            if (typeof window._construirInline === 'function') window._construirInline();

                            // 3.2. Guardar listas completas de barrios y conjuntos para dependencia
                            todosBarrios = [...new Set(
                                datos
                                    .map(d => d["Barrio"])
                                    .filter(v => v && v.trim() !== "")
                            )].sort();
                            todosConjuntos = [...new Set(
                                datos
                                    .map(d => d["Conjunto"])
                                    .filter(v => v && v.trim() !== "")
                            )].sort();

                            // 3.3. Inicializar Choices en cada <select multiple …>
                            const selects = document.querySelectorAll('.filtros select[multiple]');

                            selects.forEach(select => {
                                const instancia = new Choices(select, {
                                    placeholder: true,
                                    placeholderValue: select.options[0].text,
                                    removeItemButton: true,
                                    searchEnabled: true,
                                    searchChoices: true,
                                    shouldSort: false,
                                    allowHTML: true,
                                });

                                const inputClonado = instancia.containerOuter.element.querySelector('.choices__input--cloned');
                                if (inputClonado) {
                                    inputClonado.readOnly = true;
                                    inputClonado.tabIndex = -1;
                                }

                                choiceInstances[select.id] = instancia;

                                // 3.3.1. Cuando se agrega un tag, ocultar dropdown
                                instancia.passedElement.element.addEventListener('addItem', () => {
                                    instancia.hideDropdown();
                                });

                                // 3.3.2. Toggle y bloqueo de clic/mousedown en .choices__inner
                                const container = instancia.containerOuter.element;
                                container.addEventListener('mousedown', e => {
                                    if (e.target.closest('.choices__inner')) {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        Object.values(choiceInstances).forEach(otherInst => {
                                            if (otherInst !== instancia) otherInst.hideDropdown();
                                        });
                                        if (instancia.dropdown && instancia.dropdown.isActive) {
                                            instancia.hideDropdown();
                                        } else {
                                            instancia.showDropdown();
                                        }
                                    }
                                }, { capture: true });
                                container.addEventListener('click', e => {
                                    if (e.target.closest('.choices__inner')) {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                    }
                                }, { capture: true });

                                // 3.3.3. Cuando cambia la selección, guardar filtro y aplicar
                                instancia.passedElement.element.addEventListener('change', e => {
                                    const id = e.target.id;
                                    const selected = Array.from(e.target.selectedOptions)
                                        .map(opt => opt.value)
                                        .filter(v => v !== "");
                                    switch (id) {
                                        case "filterTipoPropiedad":  filtros["Tipo de inmueble"] = selected; break;
                                        case "filterRangoPrecio":    filtros["Rango de precio"]  = selected; break;
                                        case "filterZona":           filtros["Zona"]             = selected; break;
                                        case "filterEstrato":        filtros["Estrato"]          = selected; break;
                                        case "filterHabitaciones":   filtros["Habitaciones"]     = selected; break;
                                        case "filterGaraje":         filtros["Garaje"]           = selected; break;
                                        case "filterPisos":          filtros["Pisos"]            = selected; break;
                                        case "filterBarrio":         filtros["Barrio"]           = selected; break;
                                        case "filterConjunto":       filtros["Conjunto"]         = selected; break;
                                    }
                                    aplicarFiltros();
                                });
                            });

                            // ── PASO 3: Sincronizar UI con filtros cargados (URL o iniciales) ──
                            sincronizarUIViaFiltros();
                        }, 250); // 250ms de retardo permite al navegador pintar las 32 tarjetas inmediatamente en < 300ms
                    }

                    function sincronizarUIViaFiltros() {
                        // 1. Sincronizar UI del Hero (IIFE interna)
                        const sync = window._icdeFiltrosSync;
                        if (sync) {
                            Object.keys(sync.MAPA).forEach(campo => {
                                if (filtros[campo]) {
                                    sync.sel[campo] = Array.isArray(filtros[campo]) ? [...filtros[campo]] : [filtros[campo]];
                                }
                            });
                            sync.poblarDropdowns();
                            document.querySelectorAll('.filtros-wrapper.solo-desktop .filtro-nuevo').forEach(f => sync.renderHead(f));
                            sync.actualizarConteos();
                            sync.refreshLimpiar();
                        }

                        // 2. Sincronizar Choices.js (Panel avanzado)
                        Object.entries(choiceInstances).forEach(([id, instance]) => {
                            let key = "";
                            switch(id) {
                                case "filterTipoPropiedad": key = "Tipo de inmueble"; break;
                                case "filterRangoPrecio":   key = "Rango de precio"; break;
                                case "filterZona":          key = "Zona"; break;
                                case "filterEstrato":       key = "Estrato"; break;
                                case "filterHabitaciones":  key = "Habitaciones"; break;
                                case "filterGaraje":        key = "Garaje"; break;
                                case "filterPisos":         key = "Pisos"; break;
                                case "filterBarrio":        key = "Barrio"; break;
                                case "filterConjunto":      key = "Conjunto"; break;
                            }
                            if (key && filtros[key]) {
                                instance.setChoiceByValue(filtros[key]);
                            }
                        });
                        
                        // 3. Sincronizar Input Buscar
                        if (filtros['Buscar']) {
                            const input = document.getElementById('filterBuscarNueva') || document.getElementById('movilBuscar');
                            if (input) input.value = filtros['Buscar'];
                        }
                    }
                    // ——— Aquí inicializamos nuestro dropdown “fake” de Ordenar por ———
                    const toggle = document.getElementById('sortToggle');
                    const list = document.getElementById('sortOptions');
                    // 1) Al hacer clic en el toggle abrimos/cerramos
                    toggle.addEventListener('click', e => {
                        e.stopPropagation();
                        // Cerrar todos los filtros abiertos
                        document.querySelectorAll('.filtro-nuevo.fn-open').forEach(f => f.classList.remove('fn-open'));
                        list.classList.toggle('hidden');
                    });
                    // 2) Si se pulsa fuera, cerramos
                    document.addEventListener('click', () => list.classList.add('hidden'));
                    // 3) Cada opción…
                    list.querySelectorAll('li').forEach(li => {
                        li.addEventListener('click', () => {
                            // actualizar texto del toggle
                            toggle.textContent = li.textContent + ' ▼';
                            // marcarla seleccionada
                            list.querySelectorAll('li').forEach(x => x.classList.remove('selected'));
                            li.classList.add('selected');
                            // guardar criterio y reaplicar filtros
                            criterioOrden = li.dataset.value;
                            aplicarFiltros();
                            // cerrar menú
                            list.classList.add('hidden');
                        });
                    });

                    // ─────────────────────────────────────────────────
                    // 4. Función que llena los <select> iniciales (TODOS los datos)
                    // ─────────────────────────────────────────────────
                    function llenarOpcionesFiltros() {
                        function llenarSelect(id, campo) {
                            const select = document.getElementById(id);
                            if (!select) return;

                            let valores = [...new Set(datos.map(d => d[campo]).filter(v => v))];
                            if (["Habitaciones", "Garaje", "Pisos"].includes(campo)) {
                                valores = valores
                                    .map(v => Number(v))
                                    .filter(v => !isNaN(v))
                                    .sort((a, b) => a - b)
                                    .map(v => String(v));
                            } else {
                                valores = valores.sort();
                            }

                            select.innerHTML = `<option value="">${select.options[0].text}</option>` +
                                valores.map(v => {
                                    const cantidad = datos.filter(d => String(d[campo]) === v).length;
                                    return `<option value="${v}">${v} (${cantidad})</option>`;
                                }).join("");
                        }

                        llenarSelect("filterTipoPropiedad", "Tipo de inmueble");
                        llenarSelect("filterRangoPrecio", "Rango de precio");
                        llenarSelect("filterZona", "Zona");
                        llenarSelect("filterBarrio", "Barrio");


                        llenarSelect("filterHabitaciones", "Habitaciones");
                        llenarSelect("filterGaraje", "Garaje");
                        llenarSelect("filterPisos", "Pisos");
                    }
                    // ─────────────────────────────────────────────────
                    //  Función para ordenar lista
                    // ─────────────────────────────────────────────────
                    function ordenarLista(lista) {
                        if (criterioOrden === "destacadas") {
                            // Solo propiedades destacadas, ordenadas de mayor a menor precio
                            return lista
                                .filter(d => ["Directo", "Verbal"].includes(d["Contrato"]))
                                .sort((a, b) => parsePrecio(b["Precio"]) - parsePrecio(a["Precio"]));
                        }
                        return lista.sort((a, b) => {
                            if (criterioOrden === "menorPrecio" || criterioOrden === "mayorPrecio") {
                                // 1) Quitamos símbolos y puntos, sólo dígitos
                                const pa = parsePrecio(a["Precio"]);
                                const pb = parsePrecio(b["Precio"]);
                                return (criterioOrden === "menorPrecio" ? pa - pb : pb - pa);
                            }

                            if (criterioOrden === "rentabilidad") {
                                // 2) “no aplica” o sin datos → tratamiento como Infinity
                                const parseRet = txt => {
                                    const num = parseFloat((txt || "").toString().replace(/[^\d.]/g, ""));
                                    return isNaN(num) ? Infinity : num;
                                };
                                const ra = parseRet(a["Retorno de la Inversión"]);
                                const rb = parseRet(b["Retorno de la Inversión"]);
                                return ra - rb;
                            }

                            // Sin criterio del usuario → respetar orden del Sheet (campo _sheetOrder)
                            return (Number(a['_sheetOrder']) || 9999) - (Number(b['_sheetOrder']) || 9999);
                        });
                    }
                    // ─────────────────────────────────────────────────
                    // 5. Función que aplica TODOS los filtros (independientes + dependientes)
                    //    y luego vuelve a renderizar (sin scroll)
                    // ─────────────────────────────────────────────────

                    // --- FUZZY MATCHING HELPERS ---
                    function _normalizeStr(str) {
                        return String(str || '')
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[̀-ͯ]/g, "")
                            .replace(/[^a-z0-9 ]/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();
                    }

                    function _getEditDistance(a, b) {
                        if (a.length === 0) return b.length;
                        if (b.length === 0) return a.length;
                        const matrix = [];
                        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
                        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
                        for (let i = 1; i <= b.length; i++) {
                            for (let j = 1; j <= a.length; j++) {
                                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                                    matrix[i][j] = matrix[i - 1][j - 1];
                                } else {
                                    matrix[i][j] = Math.min(
                                        matrix[i - 1][j - 1] + 1,
                                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                                    );
                                }
                            }
                        }
                        return matrix[b.length][a.length];
                    }

                    function _matchFuzzy(query, candidate) {
                        const qNormalized = _normalizeStr(query);
                        const cNormalized = _normalizeStr(candidate);
                        const qWords = qNormalized.split(' ').filter(w => w.length > 0);
                        const cWords = cNormalized.split(' ').filter(w => w.length > 0);
                        
                        if (!qWords.length) return false;
                        
                        let matchedCount = 0;
                        for (const qw of qWords) {
                            const isNumeric = /[0-9]/.test(qw);
                            let wordMatched = false;
                            for (const cw of cWords) {
                                if (isNumeric) {
                                    if (cw.includes(qw)) { wordMatched = true; break; }
                                } else {
                                    if (cw === qw || cw.startsWith(qw)) { wordMatched = true; break; }
                                    if (cw[0] !== qw[0]) continue;
                                    const maxDist = qw.length >= 8 ? 2 : (qw.length >= 3 ? 1 : 0);
                                    if (maxDist > 0 && Math.abs(cw.length - qw.length) <= maxDist) {
                                        if (_getEditDistance(qw, cw) <= maxDist) {
                                            wordMatched = true; break;
                                        }
                                    }
                                }
                            }
                            if (wordMatched) matchedCount++;
                        }
                        return matchedCount === qWords.length;
                    }
                    function aplicarFiltros() {
                        // 5.1. Filtramos datos según TODO lo que tenga el objeto filtros
                        let filtrados = datos.filter(d => {
                            // Filtro por IDs específicos (Prioridad absoluta)
                            if (filtros["ids"] && filtros["ids"].length > 0) {
                                return filtros["ids"].includes(String(d["Código"]));
                            }

                            if (!filtroIncluye(d["Tipo de inmueble"], filtros["Tipo de inmueble"])) return false;
                            if (!filtroIncluye(d["Rango de precio"], filtros["Rango de precio"])) return false;
                            
                            // Filtro numérico de precio (min/max)
                            if (filtros["minPrice"] || filtros["maxPrice"]) {
                                const p = parsePrecio(d["Precio"]);
                                if (filtros["minPrice"] && p < filtros["minPrice"]) return false;
                                if (filtros["maxPrice"] && p > filtros["maxPrice"]) return false;
                            }
                            if (!filtroIncluye(d["Zona"], filtros["Zona"])) return false;
                            if (!filtroIncluye(String(d["Estrato"]), filtros["Estrato"])) return false;
                            if (!filtroIncluye(d["Barrio"], filtros["Barrio"])) return false;
                            if (!filtroIncluye(d["Conjunto"], filtros["Conjunto"])) return false;
                            if (!filtroIncluye(String(d["Habitaciones"]), filtros["Habitaciones"])) return false;
                            if (!filtroIncluye(String(d["Garaje"]), filtros["Garaje"])) return false;
                            if (!filtroIncluye(String(d["Pisos"]), filtros["Pisos"])) return false;
                            if (!filtroIncluye(d["Ubicación"], filtros["Ubicación"])) return false;
                            if (!filtroIncluye(d["Piscina"], filtros["Piscina"])) return false;
                            if (!filtroIncluye(d["Cocina"], filtros["Cocina"])) return false;


                            if (filtros["Buscar"]) {
                                const q = filtros["Buscar"];
                                const combinadoRaw = (
                                    (d["Nombre"] || "") + " " + 
                                    (d["Código"] || "") + " " + 
                                    (d["Zona"] || "") + " " + 
                                    (d["Barrio"] || "") + " " + 
                                    (d["Conjunto"] || "") + " " + 
                                    (d["Descripción"] || "") + " " + 
                                    (d["Puntos Clave"] || "")
                                );
                                if (!_matchFuzzy(q, combinadoRaw)) return false;
                            }
                            return true;
                        });

                        filtrados = ordenarLista(filtrados);
                        listaFiltrada = filtrados;
                        paginaActual = 1;

                        // 5.2. Volver a renderizar tarjetas SIN scroll (segundo parámetro false)
                        renderizarTarjetas(listaFiltrada, false);

                    }

                    // ─────────────────────────────────────────────────
                    // 6. Función auxiliar que comprueba inclusión (multi‐select / single‐select)
                    // ─────────────────────────────────────────────────
                    function filtroIncluye(valorDato, filtro) {
                        if (!filtro || (Array.isArray(filtro) && filtro.length === 0)) return true;
                        const v = String(valorDato || "").trim().toLowerCase();
                        if (Array.isArray(filtro)) {
                            return filtro.some(f => String(f).trim().toLowerCase() === v);
                        }
                        return v === String(filtro).trim().toLowerCase();
                    }

                    // ─────────────────────────────────────────────────
                    // 7. Función para actualizar los filtros “independientes” (con contadores dinámicos)
                    // ─────────────────────────────────────────────────
                    function actualizarFiltrosIndependientes() {
                        const filtrosInd = [
                            ["filterTipoPropiedad", "Tipo de inmueble"],
                            ["filterRangoPrecio", "Rango de precio"],
                            ["filterZona", "Zona"],
                            ["filterEstrato", "Estrato"],
                            ["filterHabitaciones", "Habitaciones"],
                            ["filterGaraje", "Garaje"],
                            ["filterPisos", "Pisos"],
                            ["filterBarrio", "Barrio"],
                        ];

                        filtrosInd.forEach(([id, campo]) => {
                            const elemento = document.getElementById(id);
                            if (!elemento) return;

                            const instancia = choiceInstances[id];
                            if (!instancia) return;

                            // 7.2. Calcular subconjunto sin aplicar el filtro actual
                            const subset = datos.filter(d =>
                                Object.keys(filtros).every(c => {
                                    if (c === campo) return true;
                                    return filtroIncluye(d[c], filtros[c]);
                                })
                            );

                            // 7.3. Obtener valores únicos posibles para este select en el dataset completo
                            let valores = [...new Set(datos.map(d => d[campo]).filter(v => v))];
                            if (["Habitaciones", "Garaje", "Pisos"].includes(campo)) {
                                valores = valores
                                    .map(v => Number(v))
                                    .filter(v => !isNaN(v))
                                    .sort((a, b) => a - b)
                                    .map(v => String(v));
                            } else {
                                valores = valores.sort();
                            }

                            // 7.4. Generar opciones para Choices
                            const opciones = [
                                {
                                    value: "",
                                    label: instancia.passedElement.element.options[0].text,
                                    selected: false,
                                    disabled: true
                                },
                                ...valores.map(v => {
                                    const cuenta = subset.filter(d => String(d[campo]) === v).length;
                                    return {
                                        value: v,
                                        label: `${v} <span class="cuenta">(${cuenta})</span>`,
                                        selected: false,
                                        disabled: false,
                                        cuenta
                                    };
                                }).filter(obj => obj.cuenta > 0)
                            ];

                            instancia.clearChoices();
                            instancia.setChoices(opciones, "value", "label", true);

                            // 7.6. Re‐marcar los valores ya seleccionados
                            const actuales = filtros[campo] || [];
                            instancia.removeActiveItems();
                            actuales.forEach(val => instancia.setChoiceByValue(val));
                        });
                    }

                    // ─────────────────────────────────────────────────
                    // 8. Función para renderizar las tarjetas (cards) + paginación + listeners
                    // ─────────────────────────────────────────────────
                    function renderizarTarjetas(lista = datos, hacerScroll = false) {
                        const cont = document.getElementById("tarjetas");

                        if (!lista.length) {
                            cont.innerHTML = `<div class="noProp">No se encontraron propiedades.</div>`;
                            document.getElementById("paginacion").innerHTML = "";
                            return;
                        }

                        const inicio = (paginaActual - 1) * tarjetasPorPagina;
                        const fin = inicio + tarjetasPorPagina;
                        const paginaDatos = lista.slice(inicio, fin);

                        function _getFotosHTML(d) {
                            var imgs = [];
                            if (d["Imagenes"]) {
                                imgs = d["Imagenes"].split('').filter(function(c){ return c !== '\r' && c !== '\n'; }).join('').split('|').map(function(u){ return u.trim(); }).filter(function(u){ return u.length > 5; });
                            }
                            if (!imgs.length && d["Image"]) imgs = [d["Image"]];
                            if (!imgs.length) imgs = [''];
                            return imgs.map(function(src, i){
                                return '<img src="' + src + '" alt="foto ' + (i+1) + '" loading="' + (i===0 ? 'eager' : 'lazy') + '" class="tarjeta-foto-slide' + (i===0 ? ' activa' : '') + '" />';
                            }).join('');
                        }

                        cont.innerHTML = paginaDatos.map(d => {
                            const cod = d["Código"];
                            const isDisliked = window.lid && window.ccFeedback && window.ccFeedback[cod]?.interes === 'DISLIKE';
                            const isLiked = window.lid && window.ccFeedback && window.ccFeedback[cod]?.interes === 'LIKE';
                            const hasComment = window.lid && window.ccFeedback && window.ccFeedback[cod]?.comentario;
                            const editingComment = window.lid && window.ccFeedback && window.ccFeedback[cod]?._editingComment;
                            const isFav = typeof getFavs === 'function' && getFavs().includes(cod);
                            
                            return `
                                                                                      <div
                                                                                        class="tarjeta ${["Directo", "Verbal"].includes(d["Contrato"]) ? "recomendado" : ""} ${isDisliked ? "cc-disliked" : ""}"
                                                                                        tabindex="0"
                                                                                        role="button"
                                                                                        aria-pressed="false"
                                                                                        data-codigo="${cod}"
                                                                                      >
                                                                                        ${["Directo", "Verbal"].includes(d["Contrato"])
                                ? `<div class="ribbon"><span>¡Destacada!</span></div>`
                                : ``
                            }
                                                                                        <div class="tarjeta-fotos">
                                                                                          <button class="btn-fav ${isFav ? 'active' : ''}" data-codigo="${cod}" onclick="event.stopPropagation(); toggleFav('${cod}')" title="Agregar a favoritos" aria-label="Favorito">
                                                                                            <svg viewBox="0 0 24 24"><path class="fav-outline" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/><path class="fav-filled" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                                                                                          </button>
                                                                                          <div class="tarjeta-fotos-strip">
                                                                                            ${_getFotosHTML(d)}
                                                                                          </div>
                                                                                          <span class="tarjeta-foto-counter"></span>
                                                                                        </div>
                                                                                        <div class="contenido">
                                                                                          <h3 class="titulo">${d["Nombre"]}</h3>
                                                                                          <p class="codigo">Código: ${cod}</p>
                                                                                          <p class="precio">${formatearPrecio(d["Precio"])}</p>
                                                                                          <div class="etiquetas">
                                                                                            <span class="etiqueta">
                                                                                              <img loading="lazy" src="https://i.imgur.com/ykKdGwE.png" alt="Habitaciones" class="icono-etiqueta" />
                                                                                              Habitaciones ${d["Habitaciones"]}
                                                                                            </span>
                                                                                            <span class="etiqueta">
                                                                                              <img loading="lazy" src="https://i.imgur.com/h9NqA32.png" alt="Baños" class="icono-etiqueta" />
                                                                                              Baños ${d["Baños"]}
                                                                                            </span>
                                                                                            <span class="etiqueta">
                                                                                              <img loading="lazy" src="https://i.imgur.com/4Yixa77.png" alt="Garaje" class="icono-etiqueta" />
                                                                                              Garaje ${d["Garaje"]}
                                                                                            </span>
                                                                                            <span class="etiqueta">
                                                                                              <img loading="lazy" src="https://i.imgur.com/rH6cXMa.png" alt="Cocina" class="icono-etiqueta" />
                                                                                              Cocina ${d["Cocina"]}
                                                                                            </span>
                                                                                            <span class="etiqueta">
                                                                                              Pisos ${d["Pisos"]}
                                                                                            </span>
                                                                                            <span class="etiqueta">
                                                                                              <img loading="lazy" src="https://i.imgur.com/rz72lGC.png" alt="Área lote" class="icono-etiqueta" />
                                                                                              Lote ${d["Área lote"]} m²
                                                                                            </span>
                                                                                            <span class="etiqueta">
                                                                                              ${d["Rentabilidad"]}
                                                                                            </span>
                                                                                          </div>
                                                                                          
                                                                                          ${window.lid ? `
                                                                                            <div id="ccCommentBox-${cod}" class="cc-comment-box" style="display: ${editingComment ? 'flex' : 'none'};" onclick="event.stopPropagation()">
                                                                                              <input type="text" id="ccCommentInput-${cod}" class="cc-comment-input" placeholder="Escribe tu opinión sobre esta propiedad..." value="${window.ccFeedback && window.ccFeedback[cod]?.comentario || ''}" onkeydown="if(event.key==='Enter') guardarCCComentario('${cod}')" />
                                                                                              <button class="cc-comment-btn" onclick="guardarCCComentario('${cod}')">Enviar</button>
                                                                                            </div>
                                                                                          ` : ''}
                                                                                        </div>
                                                                                      </div>
                                                                                    `;
                        }).join("");


                        // ─────────── (scroll manejado en cambiarPagina) ───────────
                        primeraCarga = false;


                        // 8.1. Volver a enlazar listeners para abrir modal al hacer click o Enter
                        document.querySelectorAll(".tarjeta").forEach(card => {
                            card.addEventListener("click", () => {
                                if (card._preventModal) return;
                                abrirModal(card.dataset.codigo);
                            });
                            card.addEventListener("keydown", e => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    abrirModal(card.dataset.codigo);
                                }
                            });
                            // Swipe en foto de tarjeta
                            if (!card._swipeInit) {
                                card._swipeInit = true;
                                (function(el) {
                                    var fotosEl = el.querySelector('.tarjeta-fotos');
                                    if (!fotosEl) return;
                                    var slides = fotosEl.querySelectorAll('.tarjeta-foto-slide');
                                    var counter = fotosEl.querySelector('.tarjeta-foto-counter');

                                    if (slides.length <= 1) {
                                        if (counter) counter.style.display = 'none';
                                        return;
                                    }

                                    var idx = 0;
                                    if (counter) {
                                        counter.style.display = 'block';
                                        counter.textContent = '1 / ' + slides.length;
                                    }

                                    function irFoto(n, e) {
                                        if (e) {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }
                                        el._preventModal = true;
                                        setTimeout(function(){ el._preventModal = false; }, 100);

                                        var next = ((n % slides.length) + slides.length) % slides.length;
                                        var nextImg = slides[next];
                                        if (nextImg.getAttribute('loading') === 'lazy') {
                                            nextImg.setAttribute('loading', 'eager');
                                            nextImg.src = nextImg.src;
                                        }
                                        slides[idx].classList.remove('activa');
                                        idx = next;
                                        slides[idx].classList.add('activa');
                                        if (counter) counter.textContent = (idx + 1) + ' / ' + slides.length;
                                    }

                                    var sx = 0, sy = 0, moved = false;
                                    fotosEl.addEventListener('touchstart', function(e){
                                        if (e.touches.length === 1) {
                                            sx = e.touches[0].clientX;
                                            sy = e.touches[0].clientY;
                                            moved = false;
                                        }
                                    }, { passive: true });
                                    fotosEl.addEventListener('touchmove', function(e){
                                        if (e.touches.length === 1 && Math.abs(e.touches[0].clientX - sx) > 8) {
                                            moved = true;
                                        }
                                    }, { passive: true });
                                    fotosEl.addEventListener('touchend', function(e){
                                        if (!moved) return;
                                        var dx = e.changedTouches[0].clientX - sx;
                                        var dy = e.changedTouches[0].clientY - sy;
                                        if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
                                        irFoto(idx + (dx < 0 ? 1 : -1), e);
                                    }, { passive: true });
                                })(card);
                            }
                        });

                        // 8.2. Renderizar la paginación y actualizar contador
                        renderizarPaginacion(lista.length);
                        actualizarContador();

                        // 8.3. Volver a enlazar la lógica de “comparar”
                        enlazarComparar();
                    }

                    // ─────────────────────────────────────────────────
                    // 9. Funciones de banner comparar
                    // ─────────────────────────────────────────────────
                    // Variable global para llevar el conteo de comparaciones
                    let comparaciones = [];
                    const propiedades = {}; // Aquí guardaremos las propiedades por código

                    function enlazarComparar() {
                        const banner = document.getElementById('bannerComparar');
                        const texto = document.getElementById('textoComparar');
                        const btn = document.getElementById('btnComparar');

                        // Evitar que se abra el modal al hacer clic en checkbox o etiqueta
                        document.querySelectorAll('.checkbox-comparar, .comparar-label').forEach(el => {
                            el.addEventListener('click', e => e.stopPropagation());
                        });

                        // Mapear propiedades para fácil acceso por código
                        document.querySelectorAll('.checkbox-comparar').forEach(chk => {
                            const tarjeta = chk.closest('.tarjeta'); // o el contenedor que tenga los datos
                            const codigo = chk.dataset.codigo;

                            // Puedes adaptar esto si ya tienes una lista `data` de todas las propiedades
                            propiedades[codigo] = {
                                codigo,
                                nombre: tarjeta?.querySelector('.modal-titulo')?.textContent || 'Propiedad',
                                imagen: tarjeta?.querySelector('img')?.src || '',
                                tipo: tarjeta?.querySelector('.tipo')?.textContent || 'Inmueble',
                            };

                            chk.addEventListener('change', e => {
                                const id = e.target.dataset.codigo;

                                if (e.target.checked) {
                                    if (comparaciones.length < 2) {
                                        comparaciones.push(id);
                                    } else {
                                        e.target.checked = false;
                                        alert('Solo puedes comparar 2 propiedades.');
                                    }
                                } else {
                                    comparaciones = comparaciones.filter(c => c !== id);
                                }

                                actualizarBanner();
                            });
                        });

                        btn.onclick = () => mostrarComparacion(comparaciones);
                        document.getElementById('btnLimpiarComparar').addEventListener('click', limpiarComparaciones);
                    }

                    function actualizarBanner() {
                        const banner = document.getElementById('bannerComparar');
                        const texto = document.getElementById('textoComparar');

                        texto.textContent = `Has seleccionado ${comparaciones.length} propiedad(es)`;
                        banner.classList.toggle('hidden', comparaciones.length === 0);

                        actualizarMiniaturas();
                    }

                                        function getPropImagen(d) {
                        if (!d) return '';
                        if (d["Image"]) return d["Image"];
                        if (d["imagen"]) return d["imagen"];
                        if (d["Imagenes"]) {
                            const raw = String(d["Imagenes"]).replace(/\r/g, '').replace(/\n/g, '');
                            const urls = raw.split('|').map(u => u.trim()).filter(u => u.length > 5);
                            if (urls.length > 0) return urls[0];
                        }
                        return '';
                    }

                    function actualizarMiniaturas() {
                        const contenedor = document.getElementById('miniaturasComparar');
                        contenedor.innerHTML = '';

                        comparaciones.forEach(codigo => {
                            const codStr = String(codigo);
                            const propObj = (typeof datos !== 'undefined' && Array.isArray(datos) ? datos.find(d => String(d["Código"]) === codStr) : null) || propiedades[codStr] || {};
                            const imgUrl = getPropImagen(propObj) || (propiedades[codStr] && propiedades[codStr].imagen) || '';
                            const nombreProp = propObj["Nombre"] || propObj.nombre || (propiedades[codStr] && propiedades[codStr].nombre) || 'Propiedad ' + codStr;
                            const div = document.createElement('div');
                            div.className = 'relative group';

                            div.innerHTML = `
                                                                                            <div class="group relative inline-block">
                                                                                                <!-- TOOLTIP FLOTÁNTE -->
                                                                                                <div class="tooltip-miniatura">
                                                                                                    <img loading="lazy" src="${imgUrl}" alt="${nombreProp}" class="w-24 h-24 object-cover rounded mb-2">
                                                                                                </div>
                                                                                                <!-- CHIP -->
                                                                                                <div class="chip-miniatura flex items-center">
                                                                                                    <!-- Bloque imagen + código (en columna) -->
                                                                                                    <div class="chip-imagen">
                                                                                                        <img loading="lazy" src="${imgUrl}" alt="${nombreProp}" class="chip-thumb mb-1" width="300" height="200" />
                                                                                                        <span class="chip-code text-white font-semibold">${codStr}</span>
                                                                                                    </div>
                                                                                                    <div class="chip-separator"></div>
                                                                                                    <button class="btn-x-tooltip ml-2" data-codigo="${codStr}">&times;</button>
                                                                                                </div>


                                                                                            </div>
                                                                                            `;

                            contenedor.appendChild(div);
                        });

                        // Evento para eliminar desde la X
                        contenedor.querySelectorAll('.btn-x-tooltip, .btn-x-tooltip-interno')
                            .forEach(btn => {
                                btn.addEventListener('click', e => {
                                    const cod = e.target.dataset.codigo;
                                    comparaciones = comparaciones.filter(c => String(c) !== String(cod));
                                    document.querySelector(`.checkbox-comparar[data-codigo="${cod}"]`).checked = false;
                                    actualizarMiniaturas();
                                    actualizarBanner();


                                    const banner = document.getElementById('bannerComparar');
                                    banner.classList.toggle('hidden', comparaciones.length === 0);
                                });
                            });
                    }

                    function mostrarComparacion(ids) {
                        const seleccionadas = datos.filter(d => ids.map(String).includes(String(d["Código"])));
                        const [a, b] = seleccionadas;
                        if (!a || !b) return;
                        const imgA = getPropImagen(a);
                        const imgB = getPropImagen(b);

                        function determinarMejorPropiedad(prop, a, b) {
                            const limpiarNumero = v =>
                                parseFloat((v || "").toString().replace(/[^\d.]/g, "")) || 0;
                            const prioridadTexto = v => (v || "").toString().toLowerCase();

                            const rawA = a[prop];
                            const rawB = b[prop];
                            const normA = prioridadTexto(rawA);
                            const normB = prioridadTexto(rawB);

                            // ✋ Si alguno es “no aplica”, vacío o inexistente, no comparamos
                            if (
                                !rawA || !rawB ||
                                normA === "no aplica" || normB === "no aplica"
                            ) {
                                return "";
                            }

                            switch (prop) {
                                case "Precio":
                                case "Administración": {
                                    const valA = limpiarNumero(rawA);
                                    const valB = limpiarNumero(rawB);
                                    if (valA < valB) return "a";
                                    if (valB < valA) return "b";
                                    return "";
                                }
                                case "Habitaciones":
                                case "Baños":
                                case "Garaje":
                                case "Closet":
                                case "Área lote":
                                case "Área Construida": {
                                    const valA = limpiarNumero(rawA);
                                    const valB = limpiarNumero(rawB);
                                    if (valA > valB) return "a";
                                    if (valB > valA) return "b";
                                    return "";
                                }
                                case "Cocina": {
                                    const score = txt => {
                                        const t = prioridadTexto(txt);
                                        if (t === "integral") return 3;
                                        if (t === "semi-integral" || t === "semi integral") return 2;
                                        return 1;
                                    };
                                    const aScore = score(rawA);
                                    const bScore = score(rawB);
                                    if (aScore > bScore) return "a";
                                    if (bScore > aScore) return "b";
                                    return "";
                                }
                                case "Piscina": {
                                    // Definimos una puntuación según el tipo de piscina:
                                    //   4 = social/jacuzzi
                                    //   3 = privada o jacuzzi
                                    //   2 = solo social
                                    //   1 = no tiene
                                    const scorePiscina = txt => {
                                        const t = prioridadTexto(txt);
                                        if (t.includes("social") && t.includes("jacuzzi")) return 4;
                                        if (t.includes("privada") || t.includes("jacuzzi")) return 3;
                                        if (t.includes("social")) return 2;
                                        return 1; // "no tiene" u otros
                                    };
                                    const aScore = scorePiscina(rawA);
                                    const bScore = scorePiscina(rawB);
                                    if (aScore > bScore) return "a";
                                    if (bScore > aScore) return "b";
                                    return "";
                                }
                                case "Ubicación": {
                                    // esquinera > medianera > otro
                                    if (normA.includes("esquinera") && !normB.includes("esquinera")) return "a";
                                    if (normB.includes("esquinera") && !normA.includes("esquinera")) return "b";
                                    if (normA.includes("medianera") && !normB.includes("medianera")) return "a";
                                    if (normB.includes("medianera") && !normA.includes("medianera")) return "b";
                                    return "";
                                }
                                case "Retorno de la Inversión": {
                                    const valA = limpiarNumero(rawA);
                                    const valB = limpiarNumero(rawB);
                                    if (valA < valB) return "a"; // menor años es mejor
                                    if (valB < valA) return "b";
                                    return "";
                                }
                                case "Rentabilidad": {
                                    const valA = limpiarNumero(rawA);
                                    const valB = limpiarNumero(rawB);
                                    if (valA > valB) return "a";
                                    if (valB > valA) return "b";
                                    return "";
                                }
                                default:
                                    return "";
                            }
                        }

                        const esMovil = window.innerWidth <= 767;

                        const props = [
                            "Código", "Precio", "Habitaciones", "Baños", "Cocina", "Garaje", "Closet", "Pisos",
                            "Área lote", "Área Construida", "Piscina", "Ubicación",
                            "Conjunto", "Barrio", "Zona", "Estrato", "Rentabilidad", "Retorno de la Inversión",
                            "Puntos Clave", "Administración"
                        ];

                        let tablaHTML = "";

                        if (esMovil) {
                            tablaHTML = `
<thead>
                                                                                  <tr class="fila-titulo">
                                                                                    <th colspan="2" style="text-align: center; padding: 10px;">
                                                                                      <h2 class="modal-comparar-titulo" style="margin-top: 15px;">Compara tu inmueble</h2>
                                                                                      <div class="modal-comparar-linea"></div>
                                                                                    </th>
                                                                                  </tr>
                                                                                  <tr class="fila-imagenes" style="width: 100%;">
                                                                                    <th style="width: 50%; padding: 5px;">
                                                                                      <img loading="lazy" src="${imgA}" alt="${a.Nombre}" class="modal-imagen-comparar" style="max-width: 100%; height: auto; display: block; margin: 0 auto;"/>
                                                                                      <div style="text-align: center; margin-top: 5px;">
                                                                                        <a href="${a["Google Fotos"]}" target="_blank" rel="noopener noreferrer" class="boton-fotos" style="background-color: #d4a84b; color: white; padding: 8px 12px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">
                                                                                          📷 Ver más fotos
                                                                                        </a>
                                                                                      </div>
                                                                                    </th>
                                                                                    <th style="width: 50%; padding: 5px;">
                                                                                      <img loading="lazy" src="${imgB}" alt="${b.Nombre}" class="modal-imagen-comparar" style="max-width: 100%; height: auto; display: block; margin: 0 auto;"/>
                                                                                      <div style="text-align: center; margin-top: 5px;">
                                                                                        <a href="${b["Google Fotos"]}" target="_blank" rel="noopener noreferrer" class="boton-fotos" style="background-color: #d4a84b; color: white; padding: 8px 12px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">
                                                                                          📷 Ver más fotos
                                                                                        </a>
                                                                                      </div>
                                                                                    </th>
                                                                                  </tr>
                                                                                  <tr class="fila-codigos">
                                                                                    <th style="width: 50%; text-align:center; padding-top: 0px;">
                                                                                      ${a.Nombre}
                                                                                    </th>
                                                                                    <th style="width: 50%; text-align:center; padding-top: 0px;">
                                                                                      ${b.Nombre}
                                                                                    </th>
                                                                                  </tr>
</thead>
<tbody>
                                                                                  ${props.map(prop => {
                                const valorA = prop === "Precio" ? formatearPrecio(a[prop]) :
                                    prop === "Administración" ? (a[prop] === "No aplica" ? "No aplica" : formatearPrecio(a[prop])) :
                                        prop === "Área lote" || prop === "Área Construida" ? `${a[prop]} m²` :
                                            prop === "Rentabilidad" ? (a[prop] || "-").replace(/^Rentabilidad:\s*/, "") :
                                                a[prop] || "-";
                                const valorB = prop === "Precio" ? formatearPrecio(b[prop]) :
                                    prop === "Administración" ? (b[prop] === "No aplica" ? "No aplica" : formatearPrecio(b[prop])) :
                                        prop === "Área lote" || prop === "Área Construida" ? `${b[prop]} m²` :
                                            prop === "Rentabilidad" ? (b[prop] || "-").replace(/^Rentabilidad:\s*/, "") :
                                                b[prop] || "-";

                                const mejor = determinarMejorPropiedad(prop, a, b);

                                return `
                                                                                      <tr class="fila-caracteristica">
                                                                                        <th colspan="2" style="text-align:center; padding-top: 0px;">${prop}</th>
                                                                                      </tr>
                                                                                      <tr>
                                                                                        <td style="width: 50%; text-align:center; position: relative;">
                                                                                          ${mejor === "a" ? `<span class="checkmark">✔</span>` : ""}
                                                                                          ${valorA}

                                                                                        </td>
                                                                                        <td style="width: 50%; text-align:center; position: relative;">
                                                                                          ${valorB}
                                                                                          ${mejor === "b" ? `<span class="checkmark">✔</span>` : ""}
                                                                                        </td>
                                                                                      </tr>
                                                                                    `;
                            }).join('')}
</tbody>
`;
                        } else {
                            tablaHTML = `
<thead>
                                                                                  <tr class="fila-titulo">
                                                                                    <th colspan="3" style="text-align: center; padding: 10px;">
                                                                                      <h2 class="modal-comparar-titulo">Compara tu inmueble</h2>
                                                                                      <div class="modal-comparar-linea"></div>
                                                                                    </th>
                                                                                  </tr>
                                                                                  <tr class="fila-imagenes">
                                                                                    <th></th>
                                                                                    <th><img loading="lazy" src="${imgA}" alt="${a.Nombre}" class="modal-imagen-comparar"/></th>
                                                                                    <th><img loading="lazy" src="${imgB}" alt="${b.Nombre}" class="modal-imagen-comparar"/></th>
                                                                                  </tr>
                                                                                  <tr class="fila-info">
                                                                                    <th></th>
                                                                                    <th>
                                                                                      <div class="modal-info-bloque modal-info-bloque-comparar">
                                                                                        <a href="${a["Google Fotos"]}" target="_blank" rel="noopener noreferrer" class="boton-fotos">📷 Ver más fotos</a>
                                                                                      </div>
                                                                                    </th>
                                                                                    <th>
                                                                                      <div class="modal-info-bloque modal-info-bloque-comparar">
                                                                                        <a href="${b["Google Fotos"]}" target="_blank" rel="noopener noreferrer" class="boton-fotos">📷 Ver más fotos</a>
                                                                                      </div>
                                                                                    </th>
                                                                                  </tr>
                                                                                  <tr>
                                                                                    <th>Característica</th>
                                                                                    <th>${a.Nombre}</th>
                                                                                    <th>${b.Nombre}</th>
                                                                                  </tr>
</thead>
<tbody>
                                                                                  ${props.map(prop => {
                                const valorA = prop === "Precio" ? formatearPrecio(a[prop]) :
                                    prop === "Administración" ? (a[prop] === "No aplica" ? "No aplica" : formatearPrecio(a[prop])) :
                                        prop === "Área lote" || prop === "Área Construida" ? `${a[prop]} m²` :
                                            prop === "Rentabilidad" ? (a[prop] || "-").replace(/^Rentabilidad:\s*/, "") :
                                                a[prop] || "-";
                                const valorB = prop === "Precio" ? formatearPrecio(b[prop]) :
                                    prop === "Administración" ? (b[prop] === "No aplica" ? "No aplica" : formatearPrecio(b[prop])) :
                                        prop === "Área lote" || prop === "Área Construida" ? `${b[prop]} m²` :
                                            prop === "Rentabilidad" ? (b[prop] || "-").replace(/^Rentabilidad:\s*/, "") :
                                                b[prop] || "-";

                                const mejor = determinarMejorPropiedad(prop, a, b);

                                return `
                                                                                      <tr>
                                                                                        <td class="carac-nombre">${prop}</td>
                                                                                        <td style="position: relative;">
                                                                                        ${mejor === "a" ? `<span class="checkmark">✔</span>` : ""}
                                                                                        ${valorA}
                                                                                        </td>
                                                                                        <td style="position: relative;">
                                                                                          ${valorB}
                                                                                          ${mejor === "b" ? `<span class="checkmark">✔</span>` : ""}
                                                                                        </td>
                                                                                      </tr>
                                                                                    `;
                            }).join('')}
</tbody>
`;
                        }

                        const html = `
<div class="modal-comparar">
                                                                                  <button class="modal-close btn-cerrar">×</button>
                                                                                  <div class="comparar-tabla-wrapper" style="grid-column: 1 / span 3;">
                                                                                    <table class="modal-tabla-caracteristicas comparar-tabla">
                                                                                      ${tablaHTML}
                                                                                      <tfoot>
                                                                                        <tr class="fila-botones">
                                                                                       <td class="solo-escritorio"></td>
                                                                                          <td>
                                                                                            <a id="compararWhatsappA"
                                                                                               href="#"
                                                                                               target="_blank" rel="noopener noreferrer"
                                                                                               class="boton-fotos"
                                                                                               style="background-color: #d4a84b; color: white; padding: 8px 12px;; border-radius: 5px; text-decoration: none; display: inline-block; font-weight: bold;">
                                                                                              ✆ Agendar visita
                                                                                            </a>
                                                                                          </td>

                                                                                          <td>
                                                                                            <a id="compararWhatsappB"
                                                                                               href="#"
                                                                                               target="_blank" rel="noopener noreferrer"
                                                                                               class="boton-fotos"
                                                                                               style="background-color: #d4a84b; color: white; padding: 8px 12px;; border-radius: 5px; text-decoration: none; display: inline-block; font-weight: bold;">
                                                                                              ✆ Agendar visita
                                                                                            </a>
                                                                                          </td>
                                                                                        </tr>
                                                                                      </tfoot>
                                                                                    </table>
                                                                                  </div>
</div>
`;

                        const wrapper = document.createElement('div');
                        wrapper.id = 'compararModal';
                        wrapper.classList.add('modal-overlay', 'active');
                        wrapper.innerHTML = html;
                        document.body.appendChild(wrapper);
                        history.pushState({ modalAbierto: true }, '', '');

                        // Cierre del modal
                        wrapper.querySelector('.btn-cerrar').addEventListener('click', cerrarComparar);

                        // 3) Actualizar los href de los botones con tu función existente
                        const mensajeA = `Hola, quiero agendar una visita para ver el inmueble ${a["Código"]} `;
                        const mensajeB = `Hola, quiero agendar una visita para ver el inmueble ${b["Código"]} `;
                        const btnCompA = document.getElementById('compararWhatsappA');
                        const btnCompB = document.getElementById('compararWhatsappB');
                        if (btnCompA) {
                            btnCompA.onclick = function(e) {
                                e.preventDefault();
                                abrirModalAgendarVisita(a);
                            };
                        }
                        if (btnCompB) {
                            btnCompB.onclick = function(e) {
                                e.preventDefault();
                                abrirModalAgendarVisita(b);
                            };
                        }
                    }

                    function limpiarComparaciones() {
                        comparaciones = [];
                        document.querySelectorAll('.checkbox-comparar').forEach(chk => chk.checked = false);
                        actualizarMiniaturas();
                        actualizarBanner();
                    }

                    function cerrarComparar() {
                        history.back();
                        document.getElementById('compararModal')?.remove();
                        // Opcional: resetear checkboxes y banner

                        actualizarBanner();
                    }


                    // ─────────────────────────────────────────────────
                    // 10. Funciones de modal
                    // ─────────────────────────────────────────────────

                    // ── CARRUSEL MODAL ──
                    // Expuestas en window para que lbAbrir (en otro <script>) pueda accederlas
                    window.carruselFotos = [];
                    window.carruselIdx = 0;
                    let carruselTimer = null;
                    let carruselDragInited = false;
                    let _dragEl = null;
                    const CARRUSEL_DELAY = 5000;

                    function carruselIr(idx, reiniciarTimer = true) {
                        if (!window.carruselFotos.length) return;
                        const prev = window.carruselIdx;
                        window.carruselIdx = ((idx % window.carruselFotos.length) + window.carruselFotos.length) % window.carruselFotos.length;
                        // Crossfade slides
                        const principal = document.getElementById('carruselPrincipal');
                        const slides = principal.querySelectorAll('.carrusel-slide');
                        slides.forEach((s, i) => s.classList.toggle('activa', i === window.carruselIdx));
                        // Counter
                        document.getElementById('carruselCounter').textContent = (window.carruselIdx + 1) + ' / ' + window.carruselFotos.length;
                        // Actualizar 4 miniaturas centradas en la actual
                        carruselActualizarMiniaturas();
                        if (reiniciarTimer) carruselReiniciarProgreso();
                    }

                    function carruselConstruirMiniaturas() {
                        const minDiv = document.getElementById('carruselMiniaturas');
                        if (!minDiv) return;
                        const fotos = window.carruselFotos || [];
                        if (fotos.length <= 1) {
                            minDiv.style.display = 'none';
                            minDiv.innerHTML = '';
                            return;
                        }
                        minDiv.style.display = 'flex';
                        minDiv.innerHTML = '';
                        fotos.forEach((url, i) => {
                            const img = document.createElement('img');
                            img.src = url;
                            img.className = 'carrusel-min' + (i === window.carruselIdx ? ' activa' : '');
                            img.loading = 'lazy';
                            img.draggable = false;
                            img.alt = 'Foto miniatura ' + (i + 1);
                            img.addEventListener('click', () => {
                                if (minDiv._wasDragging) return;
                                carruselIr(i);
                            });
                            minDiv.appendChild(img);
                        });
                    }

                    function carruselActualizarMiniaturas() {
                        const minDiv = document.getElementById('carruselMiniaturas');
                        if (!minDiv) return;
                        const minis = minDiv.querySelectorAll('.carrusel-min');
                        minis.forEach((img, i) => {
                            img.classList.toggle('activa', i === window.carruselIdx);
                        });
                    }

                    function carruselReiniciarProgreso() {
                        if (window.carruselFotos.length <= 1) return;
                        clearTimeout(carruselTimer);
                        carruselTimer = setTimeout(() => carruselIr(window.carruselIdx + 1), CARRUSEL_DELAY);
                    }

                    function carruselDetener() {
                        clearTimeout(carruselTimer);
                    }

                    function carruselInit(fotos) {
                        carruselDetener();
                        window.carruselFotos = fotos;
                        window.carruselIdx = 0;
                        // Construir slides en el principal
                        const principal = document.getElementById('carruselPrincipal');
                        principal.querySelectorAll('.carrusel-slide').forEach(s => s.remove());
                        fotos.forEach((url, i) => {
                            const slide = document.createElement('div');
                            slide.className = 'carrusel-slide' + (i === 0 ? ' activa' : '');
                            const img = document.createElement('img');
                            img.src = url;
                            img.draggable = false;
                            img.loading = i === 0 ? 'eager' : 'lazy';
                            img.alt = 'Foto ' + (i + 1);
                            slide.appendChild(img);
                            principal.insertBefore(slide, principal.querySelector('.carrusel-prev'));
                        });
                        // Construir miniaturas iniciales
                        carruselConstruirMiniaturas();
                        document.getElementById('carruselCounter').textContent = '1 / ' + fotos.length;
                        if (fotos.length > 1) carruselReiniciarProgreso();

                    }

                    // ── DRAG / SWIPE ──
                    var _dragSx=0, _dragPid=null, _dragMoved=false, _dragReady=false;
                    function _initCarruselDrag() {
                        if (_dragReady) return;
                        const el = document.getElementById('carruselPrincipal');
                        if (!el) return;
                        _dragReady = true;
                        function pdDown(e) {
                            if (e.target.closest('button')) return;
                            _dragSx=e.clientX; _dragPid=e.pointerId; _dragMoved=false;
                            el.setPointerCapture(e.pointerId);
                        }
                        function pdMove(e) {
                            if (e.pointerId!==_dragPid) return;
                            if (Math.abs(e.clientX-_dragSx)>8) _dragMoved=true;
                        }
                        function pdUp(e) {
                            if (e.pointerId!==_dragPid) return;
                            const d=_dragSx-e.clientX; _dragPid=null;
                            if (Math.abs(d)>=30) { if(d>0) carruselIr(window.carruselIdx+1); else carruselIr(window.carruselIdx-1); }
                        }
                        el.addEventListener('dragstart', e=>e.preventDefault());
                        el.addEventListener('pointerdown', pdDown);
                        el.addEventListener('pointermove', pdMove);
                        el.addEventListener('pointerup', pdUp);
                        el.addEventListener('pointercancel', ()=>{_dragPid=null;});
                        el.addEventListener('click', e=>{if(_dragMoved && !e.target.closest('button')){e.stopPropagation();e.preventDefault();_dragMoved=false;}},true);
                        // Swipe touch explícito como respaldo en iOS/Android
                        var _tSx=0, _tSy=0, _tMoved=false;
                        el.addEventListener('touchstart', function(e){
                            if (e.touches.length!==1) return;
                            _tSx=e.touches[0].clientX; _tSy=e.touches[0].clientY; _tMoved=false;
                        }, {passive:true});
                        el.addEventListener('touchmove', function(e){
                            if (Math.abs(e.touches[0].clientX-_tSx)>10) _tMoved=true;
                        }, {passive:true});
                        el.addEventListener('touchend', function(e){
                            if (!_tMoved) return;
                            var dx=e.changedTouches[0].clientX-_tSx;
                            var dy=e.changedTouches[0].clientY-_tSy;
                            _tMoved=false;
                            if (Math.abs(dx)<35 || Math.abs(dy)>Math.abs(dx)) return;
                            if(dx<0) carruselIr(window.carruselIdx+1); else carruselIr(window.carruselIdx-1);
                        }, {passive:true});
                    }




                    // Pausar al cerrar modal
                    document.getElementById('modalOverlay')?.addEventListener('click', e => {
                        if (e.target.id === 'modalOverlay') carruselDetener();
                    });
                    window.abrirModal = abrirModal;
                    function abrirModal(codigo) {
                        const inmueble = datos.find(d => d["Código"] === codigo);
                        if (!inmueble) return;

                        // Construir array de fotos para el carrusel
                        const fotosCarrusel = [];
                        if (inmueble["Imagenes"]) {
                            const raw = inmueble["Imagenes"].replace(/\r/g, '').replace(/\n/g, '');
                            const urls = raw
                                .split('|')
                                .map(u => u.trim())
                                .filter(u => u.length > 5);
                            fotosCarrusel.push(...urls);
                        }
                        // Si no hay Imagenes, usar Image como fallback
                        if (fotosCarrusel.length === 0 && inmueble["Image"]) {
                            fotosCarrusel.push(inmueble["Image"]);
                        }
                        if (!fotosCarrusel.length) fotosCarrusel.push('');
                        carruselInit(fotosCarrusel);
                        // alt set per slide in carruselInit
                        document.getElementById("modalTitle").textContent = inmueble["Nombre"];
                        document.getElementById("modalTipo").textContent = inmueble["Tipo de inmueble"];
                        document.getElementById("modalCodigo").textContent = inmueble["Código"];
                        document.getElementById("modalPrecio").textContent = formatearPrecio(inmueble["Precio"]);
                        document.getElementById("modalDescripcion").textContent = inmueble["Descripción"];
                        window._modalGoogleFotos = inmueble["Google Fotos"] || "";
                        document.getElementById("modalPuntosClave").textContent = inmueble["Puntos Clave"];
                        actualizarBotonWhatsapp(inmueble);
                        // Bloque etiquetas (columna izq)
                        const etiquetasCont = document.getElementById("modalEtiquetas");
                        etiquetasCont.innerHTML = `
                                <span class="modal-etiqueta"><img loading="lazy" src="https://i.imgur.com/ykKdGwE.png" alt="Habitaciones" class="icono-etiqueta" /> Habitaciones ${inmueble["Habitaciones"] || '-'}</span>
                                <span class="modal-etiqueta"><img loading="lazy" src="https://i.imgur.com/h9NqA32.png" alt="Baños" class="icono-etiqueta" /> Baños ${inmueble["Baños"] || '-'}</span>
                                <span class="modal-etiqueta"><img loading="lazy" src="https://i.imgur.com/4Yixa77.png" alt="Garaje" class="icono-etiqueta" /> Garaje ${inmueble["Garaje"] || '-'}</span>
                                <span class="modal-etiqueta"><img loading="lazy" src="https://i.imgur.com/rH6cXMa.png" alt="Cocina" class="icono-etiqueta" /> Cocina ${inmueble["Cocina"] || '-'}</span>
                                <span class="modal-etiqueta">Pisos ${inmueble["Pisos"] || '-'}</span>
                                <span class="modal-etiqueta"><img loading="lazy" src="https://i.imgur.com/rz72lGC.png" alt="Área lote" class="icono-etiqueta" /> Lote ${inmueble["Área lote"] || '-'} m²</span>
                                <span class="modal-etiqueta">${inmueble["Rentabilidad"] || '-'}</span>
                                `;

                        // Tabla características (columna derecha)
                        const tabla = document.getElementById("modalTablaCaracteristicas");
                        tabla.innerHTML = `
                                                                                                    <tr><td>Ciudad</td><td>${inmueble["Ciudad"] || '-'}</td></tr>
                                                                                                <tr><td>Zona</td><td>${inmueble["Zona"] || '-'}</td></tr>
                                                                                                <tr><td>Estrato</td><td>${inmueble["Estrato"] || '-'}</td></tr>
                                                                                                <tr><td>Ubicación</td><td>${inmueble["Ubicación"] || '-'}</td></tr>
                                                                                                <tr><td>Piscina</td><td>${inmueble["Piscina"] || '-'}</td></tr>
                                                                                                <tr><td>Área construida</td><td>${inmueble["Área Construida"] || '-'} m²</td></tr>
                                                                                                <tr><td>Administración</td><td>${inmueble["Administración"]?.toString().trim().toLowerCase() === "no aplica" ? "No aplica" : formatearPrecio(inmueble["Administración"])}</td></tr>
                                                                                                <tr><td>Retorno de la inversión</td><td>${inmueble["Retorno de la Inversión"] || '-'}</td></tr>
                                                                                                `;



                        // Mostrar modal
                        const overlay = document.getElementById("modalOverlay");
                        overlay.style.display = "flex";
                        overlay.classList.add("active");
                        overlay.focus();
                        // Registrar botones carrusel (existen ahora que el modal es visible)
                        // Botón compartir
                        var _compartir = document.getElementById('modalBtnCompartir');
                        if (_compartir) {
                            _compartir.onclick = function() {
                                var url = window.location.origin + '/propiedad/' + generarSlugPropiedad(inmueble) + '.html';
                                navigator.clipboard.writeText(url).then(function() {
                                    _compartir.textContent = '¡Enlace copiado!';
                                    setTimeout(function() {
                                        _compartir.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Compartir';
                                    }, 2000);
                                }).catch(function() {
                                    // fallback
                                    var input = document.createElement('input');
                                    input.value = url;
                                    document.body.appendChild(input);
                                    input.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(input);
                                    _compartir.textContent = '¡Enlace copiado!';
                                    setTimeout(function() {
                                        _compartir.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Compartir';
                                    }, 2000);
                                });
                            };
                        }
                        // Botón comparar en modal
                        var _btnComparar = document.getElementById('modalChkComparar');
                        var _labelComparar = document.getElementById('modalLabelComparar');
                        var _textoComparar = document.getElementById('modalCompararTexto');
                        if (_btnComparar && _labelComparar) {
                            var _codigoActual = codigo;
                            // Sincronizar estado visual al abrir modal
                            _btnComparar.checked = comparaciones.includes(_codigoActual);
                            if (_textoComparar) _textoComparar.textContent = _btnComparar.checked ? 'En comparación' : 'Comparar';
                            _btnComparar.onchange = function() {
                                var activo = _btnComparar.checked;
                                if (activo) {
                                    if (comparaciones.length >= 2) {
                                        alert('Solo puedes comparar hasta 2 propiedades a la vez.');
                                        _btnComparar.checked = false;
                                        return;
                                    }
                                    comparaciones.push(_codigoActual);
                                } else {
                                    comparaciones = comparaciones.filter(function(c){ return c !== _codigoActual; });
                                }
                                if (_textoComparar) _textoComparar.textContent = _btnComparar.checked ? 'En comparación' : 'Comparar';
                                // Actualizar banner inferior
                                var banner = document.getElementById('bannerComparar');
                                var texto = document.getElementById('textoComparar');
                                if (texto) texto.textContent = 'Has seleccionado ' + comparaciones.length + ' propiedad(es)';
                                if (banner) banner.classList.toggle('hidden', comparaciones.length === 0);
                            };
                        }
                        var _bp = document.querySelector('.carrusel-prev');
                        var _bn = document.querySelector('.carrusel-next');
                        var _be = document.getElementById('carruselExpand');
                        if (_bp) { _bp.onclick = function(e){ e.stopPropagation(); carruselIr(window.carruselIdx-1); }; }
                        if (_bn) { _bn.onclick = function(e){ e.stopPropagation(); carruselIr(window.carruselIdx+1); }; }
                        if (_be) { _be.onclick = function(e){ e.stopPropagation(); window.lbAbrir(window.carruselFotos, window.carruselIdx); }; }
                        _dragReady = false; setTimeout(_initCarruselDrag, 50);
                        // ── Schema dinámico por propiedad ──
const schemaAnterior = document.getElementById('schema-propiedad-activa');
if (schemaAnterior) schemaAnterior.remove();

const schemaScript = document.createElement('script');
schemaScript.type = 'application/ld+json';
schemaScript.id = 'schema-propiedad-activa';
schemaScript.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": inmueble["Nombre"],
  "description": inmueble["Descripción"] || inmueble["Puntos Clave"] || "",
  "image": fotosCarrusel[0] || inmueble["Image"] || "",
  "url": "https://icdeinmobiliaria.com/propiedad/" + generarSlugPropiedad(inmueble),
  "offers": {
    "@type": "Offer",
    "priceCurrency": "COP",
    "price": String(inmueble["Precio"]).replace(/[^0-9]/g, ""),
    "availability": "https://schema.org/InStock"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": inmueble["Barrio"] || "Neiva",
    "addressRegion": "Huila",
    "addressCountry": "CO"
  }
});
document.head.appendChild(schemaScript);
                        // Empujamos un estado con URL única por propiedad (SEO)
                        const _slug = generarSlugPropiedad(inmueble);
                        history.pushState({ modalAbierto: true, codigo: codigo }, inmueble["Nombre"] || '', '/propiedad/' + _slug);
                        // Actualizar title y meta description dinámicamente
                        document.title = (inmueble["Nombre"] || 'Propiedad') + ' | ICDE Inmobiliaria Neiva';
                        const _metaDesc = document.querySelector('meta[name="description"]');
                        if (_metaDesc) _metaDesc.setAttribute('content', (inmueble["Descripción"] || inmueble["Puntos Clave"] || ('Propiedad en ' + (inmueble["Barrio"] || 'Neiva') + ' - ICDE Inmobiliaria')).substring(0, 160));
                        
                        // Sincronizar Co-Creación en el Modal
                        if (window.lid) {
                            const cod = inmueble["Código"];
                            const ccAcciones = document.getElementById("modalCocreacionAcciones");
                            const ccCommentBox = document.getElementById("modalCocreacionCommentBox");
                            
                            if (ccAcciones) {
                                ccAcciones.style.display = "flex";
                                
                                // Reset active classes
                                const modalLike = document.getElementById("modalLike");
                                const modalDislike = document.getElementById("modalDislike");
                                const modalComment = document.getElementById("modalComment");
                                
                                if (modalLike) modalLike.classList.toggle("active", !!(window.ccFeedback && window.ccFeedback[cod]?.interes === 'LIKE'));
                                if (modalDislike) modalDislike.classList.toggle("active", !!(window.ccFeedback && window.ccFeedback[cod]?.interes === 'DISLIKE'));
                                
                                const hasComment = window.ccFeedback && window.ccFeedback[cod]?.comentario;
                                if (modalComment) {
                                    modalComment.classList.toggle("has-comment", !!hasComment);
                                    modalComment.innerHTML = hasComment ? '💬 Comentado' : '💬 Comentar';
                                }
                                
                                // Pre-fill and display comment box if active/has comment
                                if (ccCommentBox) {
                                    ccCommentBox.style.display = (window.ccFeedback && window.ccFeedback[cod]?._editingCommentModal) ? "flex" : "none";
                                    const commentInput = document.getElementById("modalCcCommentInput");
                                    if (commentInput) {
                                        commentInput.value = (window.ccFeedback && window.ccFeedback[cod]?.comentario) || "";
                                    }
                                }
                            }
                        } else {
                            const ccAcciones = document.getElementById("modalCocreacionAcciones");
                            const ccCommentBox = document.getElementById("modalCocreacionCommentBox");
                            if (ccAcciones) ccAcciones.style.display = "none";
                            if (ccCommentBox) ccCommentBox.style.display = "none";
                        }
                    }


                    // Cerrar modal
                    window.cerrarModal = cerrarModal;
                    function cerrarModal() {
                        const overlay = document.getElementById("modalOverlay");
                        overlay.classList.remove("active");
                        overlay.style.display = "none";
                        const s = document.getElementById('schema-propiedad-activa');
                        if (s) s.remove();
                        document.title = 'ICDE Inmobiliaria Neiva | Venta de Casas y Apartamentos en Neiva y el Huila';
                        const _metaDesc = document.querySelector('meta[name="description"]');
                        if (_metaDesc) _metaDesc.setAttribute('content', 'ICDE Inmobiliaria: casas, apartamentos y locales en venta y arriendo en Neiva y el Huila. Avalúos, diseños arquitectónicos y administración de inmuebles.');
                        if (window.location.pathname !== '/' && window.location.pathname !== '') {
                            history.pushState({ modalAbierto: false }, '', '/');
                        }
                    }


                    // Eventos para cerrar modal
                    var _mcBtn = document.getElementById("modalCloseBtn");
                    if (_mcBtn) {
                        _mcBtn.addEventListener("click", function(e){ e.stopPropagation(); cerrarModal(); });
                        _mcBtn.addEventListener("touchend", function(e){ e.stopPropagation(); e.preventDefault(); cerrarModal(); }, {passive:false});
                    }
                    document.getElementById("modalOverlay").addEventListener("click", e => {
                        if (e.target.id === "modalOverlay") cerrarModal();
                    });

                    document.addEventListener("keydown", e => {
                        if (e.key === "Escape") cerrarModal();
                    });

                    window.addEventListener('popstate', event => {
                        const overlay = document.getElementById("modalOverlay");
                        const compararModal = document.getElementById("compararModal");
                        const path = window.location.pathname;

                        // Si navegamos a /propiedad/slug, abrir ese modal
                        const match = path.match(/^\/propiedad\/(.+)/);
                        if (match && datos.length) {
                            const encontrada = datos.find(d => generarSlugPropiedad(d) === match[1]);
                            if (encontrada) {
                                abrirModal(encontrada["Código"]);
                                return;
                            }
                        }

                        // Si volvemos a /, cerrar modales
                        if (overlay && overlay.classList.contains("active")) {
                            overlay.classList.remove("active");
                            overlay.style.display = "none";
                            document.title = 'ICDE Inmobiliaria Neiva | Venta de Casas y Apartamentos en Neiva y el Huila';
                            const s = document.getElementById('schema-propiedad-activa');
                            if (s) s.remove();
                        }
                        if (compararModal) compararModal.remove();
                    });
                    // ─────────────────────────────────────────────────
                    // 11. Otras funciones
                    // ─────────────────────────────────────────────────

                    function cambiarPagina(nuevaPagina) {
                        paginaActual = nuevaPagina;
                        renderizarTarjetas(listaFiltrada.length ? listaFiltrada : datos, false);
                        var cw = document.getElementById('contadorWrapper');
                        if (!cw) return;
                        // Anchor invisible con offset para compensar header en móvil y desktop
                        var anchor = document.getElementById('scrollAnchorContador');
                        if (!anchor) {
                            anchor = document.createElement('div');
                            anchor.id = 'scrollAnchorContador';
                            anchor.style.cssText = 'position:relative;height:0;pointer-events:none;';
                            cw.parentNode.insertBefore(anchor, cw);
                        }
                        // Offset según tamaño de pantalla
                        var headerH = window.innerWidth <= 600 ? 80 : 95;
                        anchor.style.top = '-' + headerH + 'px';
                        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }

                    function renderizarPaginacion(totalItems) {
                        const totalPaginas = Math.ceil(totalItems / tarjetasPorPagina);
                        const paginacion = document.getElementById("paginacion");
                        paginacion.innerHTML = "";
                        if (totalPaginas <= 1) return;

                        const crearBoton = (texto, pagina, deshabilitado = false) => {
                            const btn = document.createElement("button");
                            btn.textContent = texto;
                            btn.classList.add("boton-paginacion");
                            if (deshabilitado) {
                                btn.disabled = true;
                                btn.classList.add("boton-deshabilitado");
                            } else {
                                btn.onclick = () => cambiarPagina(pagina);
                            }
                            return btn;
                        };

                        // Anterior
                        paginacion.appendChild(
                     // ─────────────────────────────────────────────────
                    // TARJETA DE AGENDAMIENTO DE VISITAS (NEUROVENTAS & WHATSAPP) - 3 PASOS
                    // ─────────────────────────────────────────────────
                    let inmuebleAgendarActual = null;
                    let metodosPagoSeleccionados = new Set();
                    let preaprobadoSeleccionado = "";
                    let pasoActualAgendar = 1;

                    function mostrarPasoAgendar(paso) {
                        if (paso < 1) paso = 1;
                        if (paso > 3) paso = 3;

                        pasoActualAgendar = paso;

                        // Visibilidad de contenidos de paso
                        document.querySelectorAll(".agendar-step-content").forEach(el => {
                            if (parseInt(el.getAttribute("data-step"), 10) === paso) {
                                el.classList.add("active");
                            } else {
                                el.classList.remove("active");
                            }
                        });

                        // Visibilidad de botones footer
                        document.querySelectorAll(".step-footer-actions").forEach(el => {
                            if (parseInt(el.getAttribute("data-step-footer"), 10) === paso) {
                                el.classList.add("active");
                            } else {
                                el.classList.remove("active");
                            }
                        });

                        // Actualizar indicador Stepper
                        document.querySelectorAll("#stepperAgendarVisita .stepper-step").forEach(stepEl => {
                            const stepNum = parseInt(stepEl.getAttribute("data-step"), 10);
                            const circle = stepEl.querySelector(".stepper-circle");
                            
                            if (stepNum < paso) {
                                stepEl.classList.remove("active");
                                stepEl.classList.add("completed");
                                if (circle) circle.textContent = "✓";
                            } else if (stepNum === paso) {
                                stepEl.classList.add("active");
                                stepEl.classList.remove("completed");
                                if (circle) circle.textContent = stepNum;
                            } else {
                                stepEl.classList.remove("active", "completed");
                                if (circle) circle.textContent = stepNum;
                            }
                        });

                        const line1 = document.getElementById("stepperLine1");
                        const line2 = document.getElementById("stepperLine2");
                        if (line1) line1.classList.toggle("active", paso >= 2);
                        if (line2) line2.classList.toggle("active", paso >= 3);

                        // Scroll arriba en el body del modal al cambiar de paso
                        const bodyEl = document.querySelector("#modalAgendarVisitaOverlay .modal-agendar-body");
                        if (bodyEl) bodyEl.scrollTop = 0;

                        validarFormularioAgendar();
                    }

                    function inicializarModalAgendarVisita() {
                        const overlay = document.getElementById("modalAgendarVisitaOverlay");
                        const closeBtn = document.getElementById("closeModalAgendarVisita");
                        const btnConfirmar = document.getElementById("btnConfirmarAgendamientoWA");
                        
                        if (!overlay) return;

                        // Cierre al dar clic en botón X o backdrop
                        closeBtn?.addEventListener("click", cerrarModalAgendarVisita);
                        overlay.addEventListener("click", (e) => {
                            if (e.target === overlay) cerrarModalAgendarVisita();
                        });

                        // Interceptar click en el botón "Agendar visita" del modal principal
                        const btnPrincipal = document.getElementById("modalBotonWhatsapp");
                        if (btnPrincipal) {
                            btnPrincipal.addEventListener("click", (e) => {
                                e.preventDefault();
                                const inmueble = window._inmuebleActualModal || null;
                                abrirModalAgendarVisita(inmueble);
                            });
                        }

                        // Botones de Navegación del Wizard
                        const btnNext1 = document.getElementById("btnSiguienteStep1");
                        const btnNext2 = document.getElementById("btnSiguienteStep2");
                        const btnPrev2 = document.getElementById("btnAnteriorStep2");
                        const btnPrev3 = document.getElementById("btnAnteriorStep3");

                        btnNext1?.addEventListener("click", () => {
                            if (validarPasoAgendar1()) mostrarPasoAgendar(2);
                        });

                        btnNext2?.addEventListener("click", () => {
                            if (validarPasoAgendar2()) mostrarPasoAgendar(3);
                        });

                        btnPrev2?.addEventListener("click", () => mostrarPasoAgendar(1));
                        btnPrev3?.addEventListener("click", () => mostrarPasoAgendar(2));

                        // Clics directos en los pasos del Stepper
                        document.querySelectorAll("#stepperAgendarVisita .stepper-step").forEach(stepEl => {
                            stepEl.addEventListener("click", () => {
                                const targetStep = parseInt(stepEl.getAttribute("data-step"), 10);
                                if (targetStep === 1) {
                                    mostrarPasoAgendar(1);
                                } else if (targetStep === 2 && validarPasoAgendar1()) {
                                    mostrarPasoAgendar(2);
                                } else if (targetStep === 3 && validarPasoAgendar1() && validarPasoAgendar2()) {
                                    mostrarPasoAgendar(3);
                                }
                            });
                        });

                        // Configurar Chips de Método de Pago (Multiselección)
                        document.querySelectorAll("#chipsPagoContainer .chip-pago").forEach(chip => {
                            chip.addEventListener("click", () => {
                                const val = chip.getAttribute("data-val");
                                if (chip.classList.contains("selected")) {
                                    chip.classList.remove("selected");
                                    metodosPagoSeleccionados.delete(val);
                                } else {
                                    chip.classList.add("selected");
                                    metodosPagoSeleccionados.add(val);
                                }
                                actualizarPanelCredito();
                                validarFormularioAgendar();
                            });
                        });

                        // Configurar Chips de Carta de Preaprobado
                        document.querySelectorAll("#chipsPreaprobadoContainer .chip-sub").forEach(chip => {
                            chip.addEventListener("click", () => {
                                document.querySelectorAll("#chipsPreaprobadoContainer .chip-sub").forEach(c => c.classList.remove("selected"));
                                chip.classList.add("selected");
                                preaprobadoSeleccionado = chip.getAttribute("data-val");
                                validarFormularioAgendar();
                            });
                        });

                        // Configurar Atajos de Día
                        const fechaInput = document.getElementById("agendarFechaInput");
                        if (fechaInput) {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            fechaInput.min = tomorrow.toISOString().split("T")[0];
                        }

                        document.querySelectorAll("#chipsDiaShortcuts .chip-shortcut").forEach(chip => {
                            chip.addEventListener("click", () => {
                                document.querySelectorAll("#chipsDiaShortcuts .chip-shortcut").forEach(c => c.classList.remove("active"));
                                chip.classList.add("active");
                                
                                const dayType = chip.getAttribute("data-day");
                                const d = new Date();
                                if (dayType === "manana") {
                                    d.setDate(d.getDate() + 1);
                                } else if (dayType === "finsemana") {
                                    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
                                    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
                                    d.setDate(d.getDate() + daysUntilSaturday);
                                }
                                if (fechaInput) {
                                    fechaInput.value = d.toISOString().split("T")[0];
                                }
                                validarFormularioAgendar();
                            });
                        });

                        // Helper para formatear hora 24h a 12h AM/PM
                        function formatTime12h(timeStr) {
                            if (!timeStr) return '';
                            const parts = timeStr.split(':');
                            if (parts.length < 2) return timeStr;
                            let h = parseInt(parts[0], 10);
                            const m = parts[1];
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            h = h % 12;
                            if (h === 0) h = 12;
                            return `${h}:${m} ${ampm}`;
                        }

                        // Configurar Chips de Hora Exacta
                        document.querySelectorAll(".chip-hora-exacta").forEach(chip => {
                            chip.addEventListener("click", () => {
                                document.querySelectorAll(".chip-hora-exacta").forEach(c => c.classList.remove("active"));
                                chip.classList.add("active");
                                const horaInput = document.getElementById("agendarHoraInput");
                                if (horaInput) horaInput.value = chip.getAttribute("data-hora") || "";
                                validarFormularioAgendar();
                            });
                        });

                        // Escuchadores en inputs de texto/fecha para validación en tiempo real
                        ["agendarNombreInput", "agendarPhoneInput", "agendarBancoInput", "agendarFechaInput"].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) {
                                el.addEventListener("input", validarFormularioAgendar);
                                el.addEventListener("change", validarFormularioAgendar);
                            }
                        });

                        // Selector dinámico de indicativos
                        const selPais = document.getElementById("agendarPaisSelect");
                        if (selPais) {
                            const setShortLabel = () => {
                                Array.from(selPais.options).forEach(opt => {
                                    const short = opt.getAttribute("data-short");
                                    const full = opt.getAttribute("data-full");
                                    opt.text = opt.selected ? (short || opt.value) : (full || opt.value);
                                });
                            };

                            const setFullLabels = () => {
                                Array.from(selPais.options).forEach(opt => {
                                    const full = opt.getAttribute("data-full");
                                    if (full) opt.text = full;
                                });
                            };

                            selPais.addEventListener("mousedown", setFullLabels);
                            selPais.addEventListener("focus", setFullLabels);
                            selPais.addEventListener("change", () => {
                                setShortLabel();
                                selPais.blur();
                            });
                            selPais.addEventListener("blur", setShortLabel);
                            setShortLabel();
                        }

                        btnConfirmar?.addEventListener("click", procesarYEnviarAgendamientoWA);
                    }

                    function actualizarPanelCredito() {
                        const panel = document.getElementById("panelCreditoContainer");
                        if (!panel) return;
                        
                        const tieneCredito = Array.from(metodosPagoSeleccionados).some(m => m.includes("Crédito"));
                        if (tieneCredito) {
                            panel.classList.add("open");
                        } else {
                            panel.classList.remove("open");
                            preaprobadoSeleccionado = "";
                            document.querySelectorAll("#chipsPreaprobadoContainer .chip-sub").forEach(c => c.classList.remove("selected"));
                            const bancoInput = document.getElementById("agendarBancoInput");
                            if (bancoInput) bancoInput.value = "";
                        }
                    }

                    function abrirModalAgendarVisita(inmueble) {
                        if (!inmueble) {
                            const codigo = document.getElementById("modalCodigo")?.textContent?.trim();
                            if (codigo && typeof datos !== 'undefined') {
                                inmueble = datos.find(d => String(d["Código"] || "").trim() === String(codigo).trim());
                            }
                        }

                        inmuebleAgendarActual = inmueble;

                        // Actualizar tag de inmueble
                        const tagNombre = document.getElementById("agendarInmuebleNombre");
                        if (tagNombre && inmueble) {
                            if (inmueble.esFavoritos) {
                                tagNombre.innerHTML = `📍 <strong>${inmueble.favs.length} Propiedad(es) Favorita(s)</strong> (Códs. ${inmueble.favs.join(', ')})`;
                            } else {
                                const cod = String(inmueble["Código"] || "").trim();
                                const nom = (inmueble["Nombre"] || "Inmueble").trim();
                                const precio = typeof formatearPrecio === 'function' ? formatearPrecio(inmueble["Precio"]) : inmueble["Precio"];
                                tagNombre.innerHTML = `📍 <strong>${nom}</strong> (Cód. ${cod}) — ${precio}`;
                            }
                        } else if (tagNombre) {
                            tagNombre.innerHTML = `📍 <strong>Inmueble ICDE</strong>`;
                        }

                        // Limpiar / resetear form
                        metodosPagoSeleccionados.clear();
                        preaprobadoSeleccionado = "";
                        document.querySelectorAll("#chipsPagoContainer .chip-pago").forEach(c => c.classList.remove("selected"));
                        document.querySelectorAll("#chipsPreaprobadoContainer .chip-sub").forEach(c => c.classList.remove("selected"));
                        document.querySelectorAll("#chipsDiaShortcuts .chip-shortcut").forEach(c => c.classList.remove("active"));
                        document.querySelectorAll(".chip-hora-exacta").forEach(c => c.classList.remove("active"));
                        
                        const panel = document.getElementById("panelCreditoContainer");
                        if (panel) panel.classList.remove("open");

                        const nombreInput = document.getElementById("agendarNombreInput");
                        const phoneInput = document.getElementById("agendarPhoneInput");
                        const fechaInput = document.getElementById("agendarFechaInput");
                        const horaInput = document.getElementById("agendarHoraInput");
                        const bancoInput = document.getElementById("agendarBancoInput");

                        if (nombreInput) nombreInput.value = "";
                        if (phoneInput) phoneInput.value = "";
                        if (bancoInput) bancoInput.value = "";

                        // Seleccionar por defecto "Mañana" en fecha
                        if (fechaInput) {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            fechaInput.value = d.toISOString().split("T")[0];
                            const chipManana = document.querySelector('#chipsDiaShortcuts .chip-shortcut[data-day="manana"]');
                            if (chipManana) chipManana.classList.add("active");
                        }

                        // Hora de la visita inicia sin seleccionar
                        if (horaInput) horaInput.value = "";

                        // Mostrar Paso 1 e iniciar estado del modal
                        mostrarPasoAgendar(1);

                        // Abrir overlay en frente absoluto
                        const overlay = document.getElementById("modalAgendarVisitaOverlay");
                        if (overlay) {
                            overlay.style.display = "flex";
                            overlay.style.zIndex = "99999";
                            requestAnimationFrame(() => overlay.classList.add("active"));
                        }
                    }

                    function cerrarModalAgendarVisita() {
                        const overlay = document.getElementById("modalAgendarVisitaOverlay");
                        if (overlay) {
                            overlay.classList.remove("active");
                            setTimeout(() => {
                                overlay.style.display = "none";
                            }, 300);
                        }
                    }

                    function validarPasoAgendar1() {
                        const nombre = document.getElementById("agendarNombreInput")?.value.trim() || "";
                        const phoneRaw = document.getElementById("agendarPhoneInput")?.value.trim() || "";
                        const phoneClean = phoneRaw.replace(/\D/g, "");
                        
                        const esValido = nombre.length > 0 && phoneClean.length >= 7;
                        const btnNext1 = document.getElementById("btnSiguienteStep1");
                        if (btnNext1) {
                            btnNext1.disabled = !esValido;
                            btnNext1.classList.toggle("disabled", !esValido);
                        }
                        return esValido;
                    }

                    function validarPasoAgendar2() {
                        const tienePago = typeof metodosPagoSeleccionados !== 'undefined' && metodosPagoSeleccionados.size > 0;
                        const tieneCredito = typeof metodosPagoSeleccionados !== 'undefined' && Array.from(metodosPagoSeleccionados).some(m => m.includes("Crédito"));
                        let creditoValido = true;
                        if (tieneCredito) {
                            const tienePreaprobado = typeof preaprobadoSeleccionado !== 'undefined' && !!preaprobadoSeleccionado;
                            const banco = document.getElementById("agendarBancoInput")?.value.trim() || "";
                            creditoValido = tienePreaprobado && banco.length > 0;
                        }

                        const esValido = tienePago && creditoValido;
                        const btnNext2 = document.getElementById("btnSiguienteStep2");
                        if (btnNext2) {
                            btnNext2.disabled = !esValido;
                            btnNext2.classList.toggle("disabled", !esValido);
                        }
                        return esValido;
                    }

                    function validarPasoAgendar3() {
                        const fecha = document.getElementById("agendarFechaInput")?.value || "";
                        const chipHoraActivo = document.querySelector(".chip-hora-exacta.active");
                        const horaVal = document.getElementById("agendarHoraInput")?.value || "";
                        const tieneHora = !!(chipHoraActivo || horaVal);

                        const esValido = fecha.length > 0 && tieneHora;
                        const btnWA = document.getElementById("btnConfirmarAgendamientoWA");
                        if (btnWA) {
                            btnWA.disabled = !esValido;
                            btnWA.classList.toggle("disabled", !esValido);
                        }
                        return esValido;
                    }

                    function validarFormularioAgendar() {
                        const p1 = validarPasoAgendar1();
                        const p2 = validarPasoAgendar2();
                        const p3 = validarPasoAgendar3();
                        return p1 && p2 && p3;
                    }

                    function procesarYEnviarAgendamientoWA() {
                        if (!validarFormularioAgendar()) return;

                        const nombreInput = document.getElementById("agendarNombreInput");
                        const phoneInput = document.getElementById("agendarPhoneInput");
                        const fechaInput = document.getElementById("agendarFechaInput");
                        const horaInput = document.getElementById("agendarHoraInput");
                        const bancoInput = document.getElementById("agendarBancoInput");

                        const nombre = nombreInput?.value.trim() || "";
                        const paisSelect = document.getElementById("agendarPaisSelect");
                        const codigoPais = paisSelect ? paisSelect.value : "+57";
                        const phoneRaw = phoneInput?.value.trim() || "";
                        const phone = phoneRaw ? (phoneRaw.startsWith("+") ? phoneRaw : (codigoPais === "+57" ? phoneRaw : `${codigoPais} ${phoneRaw}`)) : "";
                        const fecha = fechaInput?.value || "";
                        
                        // Obtener franja u hora seleccionada
                        const chipHoraActivo = document.querySelector(".chip-hora-exacta.active");
                        let horaFinal = "";
                        if (chipHoraActivo) {
                            horaFinal = chipHoraActivo.textContent.trim();
                        } else if (horaInput?.value) {
                            horaFinal = formatTime12h(horaInput.value);
                        } else {
                            horaFinal = "9:00 AM";
                        }

                        // Validaciones básicas
                        if (!nombre) {
                            alert("Por favor ingrese su Nombre completo.");
                            nombreInput?.focus();
                            return;
                        }
                        if (!phone) {
                            alert("Por favor ingrese su número de WhatsApp.");
                            phoneInput?.focus();
                            return;
                        }
                        if (metodosPagoSeleccionados.size === 0) {
                            alert("Por favor seleccione al menos un método de pago.");
                            return;
                        }

                        const tieneCredito = Array.from(metodosPagoSeleccionados).some(m => m.includes("Crédito"));
                        if (tieneCredito) {
                            if (!preaprobadoSeleccionado) {
                                alert("Por favor indique si cuenta con la carta de preaprobado.");
                                return;
                            }
                            if (!bancoInput?.value.trim()) {
                                alert("Por favor escriba con qué banco o entidad.");
                                bancoInput?.focus();
                                return;
                            }
                        }

                        if (!fecha) {
                            alert("Por favor seleccione el día de la visita.");
                            fechaInput?.focus();
                            return;
                        }
                        if (!horaFinal) {
                            alert("Por favor seleccione o escriba la hora de la visita.");
                            return;
                        }

                        // Formatear Método de Pago
                        let metodoPagoTexto = "";
                        const arrayMetodos = Array.from(metodosPagoSeleccionados);
                        const tieneEfectivo = arrayMetodos.some(m => m.includes("Efectivo"));
                        
                        if (tieneEfectivo && tieneCredito) {
                            metodoPagoTexto = "Efectivo y crédito 💳";
                        } else if (tieneEfectivo) {
                            metodoPagoTexto = "Efectivo💰";
                        } else if (tieneCredito) {
                            metodoPagoTexto = "Crédito 🏦";
                        }

                        // Formatear Fecha (DíaSemana DD/MM/YYYY)
                        let fechaFormateada = fecha;
                        if (fecha && fecha.includes("-")) {
                            const [yr, mo, dy] = fecha.split("-").map(Number);
                            const dateObj = new Date(yr, mo - 1, dy);
                            const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                            const diaNombre = diasSemana[dateObj.getDay()] || "";
                            const pad = n => String(n).padStart(2, "0");
                            fechaFormateada = `${diaNombre} ${pad(dy)}/${pad(mo)}/${yr}`;
                        }

                        // Formatear Hora / Franja Horaria
                        let horaFormateada = horaFinal;
                        if (!horaFormateada.toLowerCase().includes("mañana") && !horaFormateada.toLowerCase().includes("tarde")) {
                            if (horaFinal === "8:00 AM") {
                                horaFormateada = "En la mañana (8:00 AM - 12:00 PM)";
                            } else if (horaFinal === "2:00 PM") {
                                horaFormateada = "En la tarde (2:00 PM - 6:00 PM)";
                            } else if (horaFinal.toUpperCase().includes("AM")) {
                                horaFormateada = `En la mañana (${horaFinal})`;
                            } else if (horaFinal.toUpperCase().includes("PM")) {
                                horaFormateada = `En la tarde (${horaFinal})`;
                            }
                        }

                        let msg = `Hola ICDE Inmobiliaria 🏠\n\n`;

                        if (inmuebleAgendarActual && inmuebleAgendarActual.esFavoritos) {
                            let lineasPropiedades = [];
                            const idsArr = inmuebleAgendarActual.favs || [];
                            
                            if (inmuebleAgendarActual.lineas && inmuebleAgendarActual.lineas.length) {
                                lineasPropiedades = inmuebleAgendarActual.lineas.map(l => {
                                    let limpia = l.replace(/^\*+/g, '').replace(/\*+$/g, '').trim();
                                    if (limpia.startsWith("✅")) return limpia;
                                    return `✅${limpia}`;
                                });
                            } else if (idsArr.length && typeof datos !== 'undefined') {
                                lineasPropiedades = idsArr.map(cod => {
                                    const prop = datos.find(d => String(d["Código"]).trim() === String(cod).trim());
                                    if (prop) {
                                        const nom = (prop["Nombre"] || "Inmueble").trim();
                                        const prc = typeof formatearPrecio === 'function' ? formatearPrecio(prop["Precio"]) : prop["Precio"];
                                        return `✅${nom} (Cód. ${cod}) - ${prc}`;
                                    }
                                    return `✅Inmueble (Cód. ${cod})`;
                                });
                            }

                            const catalogoURL = `https://icdeinmobiliaria.com/?ids=${idsArr.join(',')}`;

                            msg += `Me interesan las siguientes propiedades y me gustaría agendar una visita:\n\n`;
                            msg += `${lineasPropiedades.join('\n')}\n\n`;
                            msg += `🔗 Mi catálogo personalizado:\n${catalogoURL}\n\n`;
                        } else {
                            let nombreInmueble = "Inmueble";
                            let codInmueble = "";
                            let precioInmueble = "";

                            if (inmuebleAgendarActual) {
                                codInmueble = String(inmuebleAgendarActual["Código"] || "").trim();
                                nombreInmueble = (inmuebleAgendarActual["Nombre"] || "Inmueble").trim();
                                precioInmueble = typeof formatearPrecio === 'function' ? formatearPrecio(inmuebleAgendarActual["Precio"]) : inmuebleAgendarActual["Precio"];
                            } else {
                                codInmueble = document.getElementById("modalCodigo")?.textContent?.trim() || "";
                                nombreInmueble = document.getElementById("modalTitle")?.textContent?.trim() || "Inmueble";
                                precioInmueble = document.getElementById("modalPrecio")?.textContent?.trim() || "";
                            }

                            msg += `Me interesan las siguientes propiedades y me gustaría agendar una visita:\n\n`;
                            msg += `✅${nombreInmueble} (Cód. ${codInmueble}) - ${precioInmueble}\n\n`;
                            msg += `🔗 Mi catálogo personalizado:\nhttps://icdeinmobiliaria.com/?ids=${codInmueble}\n\n`;
                        }

                        msg += `Nombre completo:\n${nombre}\n`;
                        msg += `🟢WhatsApp:\n${phone}\n\n`;
                        msg += `Método de pago:\n${metodoPagoTexto}\n`;

                        if (tieneCredito) {
                            msg += `Cuenta con la carta de preaprobado ✅: ${preaprobadoSeleccionado}\n`;
                            msg += `Banco / Entidad: ${bancoInput.value.trim()}\n`;
                        }

                        msg += `\n📅 ${fechaFormateada}\n`;
                        msg += `⌚ ${horaFormateada}`;

                        // Enviar a WhatsApp
                        const urlWA = `https://api.whatsapp.com/send?phone=573208762117&text=${encodeURIComponent(msg)}`;
                        window.open(urlWA, "_blank", "noopener,noreferrer");

                        // Cerrar modal
                        cerrarModalAgendarVisita();
                    }

                    // Inicializar eventos
                    if (document.readyState === "loading") {
                        document.addEventListener("DOMContentLoaded", inicializarModalAgendarVisita);
                    } else {
                        inicializarModalAgendarVisita();
                    }


                    function mostrarAlertaComparacion() {
                        const alerta = document.getElementById("alerta-comparacion");
                        alerta.classList.remove("hidden", "opacity-0");
                        alerta.classList.add("opacity-100");

                        setTimeout(() => {
                            alerta.classList.remove("opacity-100");
                            alerta.classList.add("opacity-0");
                            setTimeout(() => {
                                alerta.classList.add("hidden");
                            }, 300);
                        }, 3000);
                    }

                    // ─────────────────────────────────────────────────
                    // 12. CONFIGURACIÓN DE EVENTOS DE FILTROS
                    // ─────────────────────────────────────────────────

                    // Eventos de filtros
                    document.querySelectorAll(".filtros select").forEach(select => {
                        select.addEventListener("change", e => {
                            const id = e.target.id;

                            // Aquí detectamos si es múltiple y obtenemos todas las opciones seleccionadas
                            let val;
                            if (e.target.multiple) {
                                val = Array.from(e.target.selectedOptions).map(opt => opt.value).filter(v => v !== "");
                            } else {
                                val = e.target.value;
                            }

                            switch (id) {
                                case "filterTipoPropiedad": filtros["Tipo de inmueble"] = val; break;
                                case "filterRangoPrecio": filtros["Rango de precio"] = val; break;
                                case "filterZona": filtros["Zona"] = val; break;
                                case "filterEstrato": filtros["Estrato"] = val; break;
                                case "filterBarrio": filtros["Barrio"] = val; break;
                                case "filterConjunto": filtros["Conjunto"] = val; break;
                                case "filterHabitaciones": filtros["Habitaciones"] = val; break;
                                case "filterGaraje": filtros["Garaje"] = val; break;
                                case "filterPisos": filtros["Pisos"] = val; break;
                            }
                            actualizarFiltrosIndependientes();
                            aplicarFiltros();
                        });
                    });

                    document.getElementById("filterBuscar").addEventListener("input", e => {
                        filtros["Buscar"] = e.target.value.trim();
                        aplicarFiltros();
                    });


                    // ─────────────────────────────────────────────────
                    // 13. Listener para el botón “Limpiar filtros”
                    // ─────────────────────────────────────────────────

                    document.getElementById('clearFilters').addEventListener('click', () => {

                        // 1) Limpiar el objeto global filtros
                        filtros["Tipo de inmueble"] = [];
                        filtros["Rango de precio"] = [];
                        filtros["Zona"] = [];
                        filtros["Barrio"] = [];
                        filtros["Estrato"] = [];
                        filtros["Conjunto"] = [];
                        filtros["Habitaciones"] = [];
                        filtros["Garaje"] = [];
                        filtros["Pisos"] = [];
                        filtros["Buscar"] = "";

                        // 2) Limpia visualmente todas las selecciones
                        Object.values(choiceInstances).forEach(instance => {
                            instance.removeActiveItems(); // borra cada “tag” seleccionado
                        });

                        // 3) (Opcional) resetea también el valor interno del select
                        document.querySelectorAll('.filtros select[multiple]').forEach(sel => {
                            sel.value = [];
                        });

                        // 3) Limpia el campo de búsqueda
                        const buscar = document.getElementById('filterBuscar');
                        buscar.value = '';

                        // 4) Actualiza dependientes y vuelve a renderizar
                        actualizarFiltrosIndependientes();
                        aplicarFiltros();
                    });

                    // ─────────────────────────────────────────────────
                    // 14. PANEL “GIF CONTAINER” + TOGGLE DE SERVICIOS
                    // ─────────────────────────────────────────────────
                    // Seleccionamos TODOS los toggles y TODOS los contenedores
                    const toggles = document.querySelectorAll('.toggle-services');
                    const containers = {
                        gif: document.querySelector('.gif-container'),
                        fixed: document.querySelector('.fixed-header')
                    };

                    // Función genérica para abrir/cerrar paneles en un contenedor dado
                    function togglePanels(container) {
                        if (!container.classList.contains('open-panel1')) {
                            container.classList.add('open-panel1');
                            setTimeout(() => container.classList.add('open-panel2'), 400);
                        } else {
                            container.classList.remove('open-panel2');
                            setTimeout(() => container.classList.remove('open-panel1'), 300);
                        }
                    }

                    // Asociamos el evento a cada toggle
                    toggles.forEach(toggle => {
                        toggle.addEventListener('click', e => {
                            e.preventDefault();
                            // Detectamos de cuál contenedor vino el toggle
                            const inGif = !!toggle.closest('.gif-container');
                            const inFix = !!toggle.closest('.fixed-header');
                            if (inGif) {
                                togglePanels(containers.gif);
                            }
                            if (inFix) {
                                togglePanels(containers.fixed);
                            }
                        });
                    });

                    // Los mismos cierres con X, duplicándolos para ambos paneles
                    document.querySelectorAll('.salir-servicios, .salir-servicios2').forEach(btn => {
                        btn.addEventListener('click', () => {
                            ['gif', 'fixed'].forEach(key => {
                                const c = containers[key];
                                c.classList.remove('open-panel2');
                                setTimeout(() => c.classList.remove('open-panel1'), 300);
                            });
                        });
                    });

                    document.addEventListener('click', e => {
                        ['gif', 'fixed'].forEach(key => {
                            const c = containers[key];
                            if (c.contains(e.target)) return;
                            if (c.classList.contains('open-panel1')) {
                                c.classList.remove('open-panel2');
                                setTimeout(() => c.classList.remove('open-panel1'), 300);
                            }
                        });
                    });


                    // ─────────────────────────────────────────────────
                    // SEO: slug único por propiedad + apertura por URL
                    // ─────────────────────────────────────────────────
                    function generarSlugPropiedad(inmueble) {
                        const nombre = (inmueble["Nombre"] || '').toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').substring(0, 60);
                        const codigo = String(inmueble["Código"] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        return nombre ? nombre + '-' + codigo : 'propiedad-' + codigo;
                    }

                    // Si el usuario llega directamente a /propiedad/slug (desde Google o un link compartido)
                    function abrirDesdeURL() {
                        const path = window.location.pathname;
                        const match = path.match(/^\/propiedad\/(.+)/);
                        if (!match) return;
                        let slugURL = match[1];
                        if (slugURL.endsWith('.html')) {
                            slugURL = slugURL.slice(0, -5);
                        }
                        // Buscar la propiedad cuyo slug coincida
                        const encontrada = datos.find(d => generarSlugPropiedad(d) === slugURL);
                        if (encontrada) {
                            abrirModal(encontrada["Código"]);
                        }
                    }

                    // ─────────────────────────────────────────────────
                    // 14. Reemplazamos DOMContentLoaded por window.onload
                    // ─────────────────────────────────────────────────
                    document.addEventListener('DOMContentLoaded', () => {
                        // 1) Estado inicial en historial
                        history.replaceState({ modalAbierto: false }, '', '');

                        // 2) Inicia carga de datos INMEDIATAMENTE
                        cargarDatos();

                        // 3) Menú hamburguesa
                        // 1) Para cada menú hamburguesa (tanto en GIF como en fixed)
                        document.querySelectorAll('.menu-container').forEach(container => {
                            const icon = container.querySelector('.menu-icon');
                            const menu = container.querySelector('.menu');
                            if (!icon || !menu) return;

                            icon.addEventListener('click', e => {
                                e.stopPropagation();                    // que no suba al document
                                // cerramos cualquier otro menú abierto
                                document.querySelectorAll('.menu-container .menu.active')
                                    .forEach(m => m !== menu && m.classList.remove('active'));
                                // cerrar panel de servicios si está abierto
                                ['gif', 'fixed'].forEach(key => {
                                    const c = containers[key];
                                    if (c && c.classList.contains('open-panel1')) {
                                        c.classList.remove('open-panel2');
                                        setTimeout(() => c.classList.remove('open-panel1'), 300);
                                    }
                                });
                                // toggle sólo el nuestro
                                menu.classList.toggle('active');
                            });
                        });

                        // 4) Listener global: si pinchas FUERA de **cualquiera** de estos contenedores, cerramos todo
                        document.addEventListener('click', e => {
                            // comprobamos si el click ocurrió _dentro_ de algún menu-container O
                            // dentro de alguno de los panels de servicios
                            if (
                                e.target.closest('.menu-container') ||
                                e.target.closest('.services-panel')
                            ) {
                                return; // no cerramos nada si el click fue dentro
                            }
                            // si llegamos aquí, el click fue fuera: cerramos menús y paneles
                            document.querySelectorAll('.menu-container .menu.active')
                                .forEach(m => m.classList.remove('active'));
                            document.querySelectorAll('.gif-container.open-panel1, .gif-container.open-panel2')
                                .forEach(gif => {
                                    gif.classList.remove('open-panel2');
                                    setTimeout(() => gif.classList.remove('open-panel1'), 0);
                                });
                        });
                        // ───────────── IntersectionObserver para el banner fijo ─────────────
                        const gifCont = document.querySelector('.gif-container');
                        const fixedHeader = document.querySelector('.fixed-header');
                        const sentinel = document.getElementById('header-sentinel');

                        if (gifCont && fixedHeader && sentinel) {
                            const io = new IntersectionObserver(entries => {
                                entries.forEach(entry => {
                                    if (entry.isIntersecting) {
                                        gifCont.style.display = '';
                                        fixedHeader.classList.remove('active');
                                    } else {
                                        gifCont.style.display = 'none';
                                        fixedHeader.classList.add('active');
                                    }
                                });
                            }, {
                                root: null,
                                threshold: 0
                            });

                            io.observe(sentinel);
                        }
                        // 6) Listener para recargar al hacer click en el logo
                        const logoEl = document.querySelector('.logo');
                        if (logoEl) {
                            logoEl.addEventListener('click', () => location.reload());
                        }

                        // 7) Cerrar modalComparacion al hacer clic fuera
                        document.addEventListener('click', e => {
                            const modal = document.getElementById('modalComparacion');
                            if (!modal || modal.classList.contains('hidden')) return;
                            if (
                                modal.contains(e.target) ||
                                e.target.closest('#btnComparar') ||
                                e.target.closest('#btnLimpiarComparar')
                            ) return;
                            modal.classList.add('hidden');
                        });

                    });

                    /* === Configuración de hover/transiciones ============================== */
                    const HOVER_MS = 320;
                    const HOVER_EASE = "cubic-bezier(.2,.6,.2,1)";

                    /* === Orden de revelado por grupos (sincronizado por fila) ============= */
                    /* 1) img1 + slot1 + jovel
                       2) slot2
                       3) slot3 + slot4 + img2
                       4) slot5 + slot6
                    */
                    const REVEAL_STEPS = [
                        ["cell-img1", "cell-slot1", "cell-jovel"],
                        ["cell-slot2"],
                        ["cell-slot3", "cell-slot4", "cell-img2"],
                        ["cell-slot5", "cell-slot6"]
                    ];

                    /* === Logos por celda (hardcoded, sin API) ============================== */
                    const DESK_SLOTS = [
                        {
                            cell: "cell-slot1",
                            name: "Soluciones La Primavera",
                            url: "https://www.solucioneslaprimavera.com/",
                            logo: "https://i.imgur.com/3OZU62r.png",
                            logonegro: "https://i.imgur.com/tJ9Nr2z.png",
                            bgClass: "bg-gray",
                            sizePct: 80
                        },
                        {
                            cell: "cell-slot2",
                            name: "Santa María Vera",
                            url: "https://inmobiliariasantamariavera.com/",
                            logo: "https://i.imgur.com/JoMeVmg.png",
                            logonegro: "https://i.imgur.com/p5cVes5.png",
                            bgClass: "bg-black"
                        },
                        {
                            cell: "cell-slot3",
                            name: "Rocha",
                            url: "https://rochafincaraiz.com/welcome/",
                            logo: "https://i.imgur.com/wjoVxSh.png",
                            logonegro: "https://i.imgur.com/CTVJBcs.png",
                            bgClass: "bg-gray",
                            sizePct: 70
                            // más grande solo este
                        },
                        {
                            cell: "cell-slot4",
                            name: "Inmobiliaria JP Escobar",
                            url: "https://www.inmobiliariajpescobar.com.co/",
                            logo: "https://i.imgur.com/qplz1JN.png",
                            logonegro: "https://i.imgur.com/wCVwW3q.png",
                            bgClass: "bg-black"
                        },
                        {
                            cell: "cell-slot5",
                            name: "Casa Honor Inmobiliaria",
                            url: "https://casahonorinmobiliaria.com/",
                            logo: "https://i.imgur.com/QC7bWHR.png",
                            logonegro: "https://i.imgur.com/RlRINvm.png",
                            bgClass: "bg-black"
                        },

                        // cell-slot6 se usa como ROTACIÓN
                    ];


                    const ROTATE_MS = 5000;

                    /* Aliados que rotan en cell-slot6 */
                    const ROTATE_ITEMS = [
                        {
                            name: "Asuntos inmobiliarios",
                            url: "https://www.facebook.com/figueroayasociadoshuila/?locale=es_LA",
                            logo: "https://i.imgur.com/Bgq3Q4D.png",
                            logonegro: "https://i.imgur.com/xXwO4mk.png",
                            sizePct: 84
                        },
                        {
                            name: "Inmobiliaria Casa & Casa",
                            url: "https://casaycasainmobiliariadelhuila.com/",
                            logo: "https://i.imgur.com/lqq5aZK.png",
                            logonegro: "https://i.imgur.com/04IPqGc.png",
                            sizePct: 60
                        },
                        {
                            name: "Inmobiliaria Rustik House",
                            url: "https://inmobiliarianeiva.com/",
                            logo: "https://i.imgur.com/nZwIrQ9.png",
                            logonegro: "https://i.imgur.com/dDsP1C4.png",
                            sizePct: 65
                        }, {
                            name: "Mac Negocios Inmobiliarios",
                            url: "https://web.facebook.com/people/MAC-negocios-Inmobiliarios/61581485549130/?_rdc=1&_rdr#",
                            logo: "https://i.imgur.com/yFrSt1J.png",
                            logonegro: "https://i.imgur.com/Rj8UIBw.png",
                            sizePct: 70
                        }, {
                            name: "Rediis",
                            url: "https://www.instagram.com/rediisarmiento/",
                            logo: "https://i.imgur.com/z7rH2Lc.png",
                            logonegro: "https://i.imgur.com/noOfIiU.png",
                            sizePct: 70
                        }, {
                            name: "Elite Group",
                            url: "https://inmobiliariaelitegroupsas.com/",
                            logo: "https://i.imgur.com/GUQR7li.png",
                            logonegro: "https://i.imgur.com/Y1O2U4t.png",
                            sizePct: 70
                        },
                        {
                            name: "Menber",
                            url: "https://casasenventaneiva.com/",
                            logo: "logoMenber dorado.webp",
                            logonegro: "logoMenber Blanco.webp",
                            sizePct: 80
                        }
                        /*
,{
name: "Inmobiliaria Felix Trujillo Falla",
url: "https://felixtrujillofalla.com/",
logo: "https://i.imgur.com/nQ0HCJA.png",
logonegro: "https://i.imgur.com/DWSlrpS.png",
sizePct: 70
}
*/
                    ];

                    /* === FONDOS por celda para conservar el ajedrezado (desktop) ============ */
                    const DESK_BG_BY_CELL = {
                        "cell-slot1": "bg-black",
                        "cell-slot2": "bg-gray",
                        "cell-slot3": "bg-black",
                        "cell-slot4": "bg-gray",
                        "cell-slot5": "bg-gray",
                        "cell-slot6": "bg-black"
                    };

                    /* === Pool único (fijos + rotatorios) ==================================== */
                    const ROTATE_POOL = [
                        ...DESK_SLOTS.map(s => ({
                            name: s.name,
                            url: s.url,
                            logo: s.logo,
                            logonegro: s.logonegro,
                            sizePct: s.sizePct || 72
                        })),
                        ...ROTATE_ITEMS
                    ];

                    // Índice base de fotograma (garantiza que cada tick muestre items distintos por celda)
                    let deskBase = 0;

                    // Pool sin duplicados (por nombre+url+logo+logonegro)
                    const ROTATE_POOL_UNIQUE = uniqueBy(
                        ROTATE_POOL,
                        it => `${it.name}|${it.url}|${it.logo}|${it.logonegro || ""}`
                    );

                    // Pinta un "fotograma" completo sin duplicados: celda j usa pool[(base+j)%len]
                    function paintDeskFrame(baseIdx) {
                        const pool = ROTATE_POOL_UNIQUE;
                        if (!pool.length) return;

                        ROTATE_CELLS.forEach((cellId, j) => {
                            const cell = document.getElementById(cellId);
                            if (!cell) return;

                            // Animación corta (stagger)
                            setTimeout(() => {
                                cell.classList.add("fade-enter");
                                const item = pool[(baseIdx + j) % pool.length];
                                const bgClass = DESK_BG_BY_CELL[cellId] || "bg-black";
                                mountLogo(cellId, { ...item, bgClass });
                                requestAnimationFrame(() => cell.classList.add("fade-active"));
                                setTimeout(() => cell.classList.remove("fade-enter", "fade-active"), 300);
                            }, j * 60);
                        });
                    }

                    function tickDeskRotation() {
                        deskBase = (deskBase + 1) % ROTATE_POOL_UNIQUE.length;
                        paintDeskFrame(deskBase);
                    }

                    let deskRotateTimer = null;
                    function startRotationAllDesktop() {
                        // Fondos iniciales por celda (ajedrezado)
                        Object.entries(DESK_BG_BY_CELL).forEach(([id, bg]) => {
                            const cell = document.getElementById(id);
                            if (!cell) return;
                            cell.classList.remove("bg-black", "bg-gray");
                            cell.classList.add(bg);
                        });

                        // Pintado inicial sin duplicados
                        deskBase = 0;
                        paintDeskFrame(deskBase);

                        // Intervalo global
                        if (deskRotateTimer) clearInterval(deskRotateTimer);
                        deskRotateTimer = setInterval(tickDeskRotation, ROTATE_MS);

                        // Pausa/resume al hover en cualquier celda
                        ROTATE_CELLS.forEach(cellId => {
                            const el = document.getElementById(cellId);
                            if (!el) return;
                            el.addEventListener("pointerenter", () => {
                                if (deskRotateTimer) { clearInterval(deskRotateTimer); deskRotateTimer = null; }
                            });
                            el.addEventListener("pointerleave", () => {
                                if (!deskRotateTimer) deskRotateTimer = setInterval(tickDeskRotation, ROTATE_MS);
                            });
                        });
                    }

                    /* === Celdas que rotan (todas las de logo; Jovel/img no entran) ========= */
                    const ROTATE_CELLS = ["cell-slot1", "cell-slot2", "cell-slot3", "cell-slot4", "cell-slot5", "cell-slot6"];

                    /* === Estado independiente por celda (para que no cambien a la vez) ===== */
                    const deskState = ROTATE_CELLS.reduce((acc, cellId, i) => {
                        acc[cellId] = { idx: i % ROTATE_POOL.length };
                        return acc;
                    }, {});

                    /* === Preload para evitar “parpadeo” =================================== */
                    const preloadCache = new Set();
                    function preload(src) {
                        if (!src || preloadCache.has(src)) return;
                        const im = new Image();
                        im.src = src;
                        preloadCache.add(src);
                    }

                    /* === Helper: overlay dorado =========================================== */
                    function buildOverlay() {
                        const ov = document.createElement("div");
                        ov.style.position = "absolute";
                        ov.style.inset = "0";
                        ov.style.background = "#d4a84b";
                        ov.style.opacity = "0";
                        ov.style.pointerEvents = "none";
                        ov.style.zIndex = "0";
                        ov.style.willChange = "opacity";
                        ov.style.transition = `opacity ${HOVER_MS}ms ${HOVER_EASE}`;
                        return ov;
                    }

                    /* === Helper: anchor con doble imagen (sin hover en imágenes) ========== */
                    function buildAnchor({ name, url, logo, logonegro, sizePct = 72 }) {
                        const a = document.createElement("a");
                        a.href = url; a.target = "_blank"; a.rel = "noopener";
                        a.setAttribute("aria-label", name);

                        const wrap = document.createElement("div");
                        wrap.style.position = "relative";
                        wrap.style.width = "100%";
                        wrap.style.height = "100%";
                        wrap.style.display = "grid";
                        wrap.style.placeItems = "center";
                        wrap.style.zIndex = "1";

                        const size = `${sizePct}%`;

                        // Base (normal)
                        const imgBase = document.createElement("img");
                        imgBase.src = logo;
                        imgBase.alt = name;
                        imgBase.loading = "lazy";
                        imgBase.decoding = "async";
                        imgBase.style.maxWidth = size;
                        imgBase.style.maxHeight = size;
                        imgBase.style.objectFit = "contain";
                        imgBase.style.opacity = "1";
                        imgBase.style.transition = `opacity ${HOVER_MS}ms ${HOVER_EASE}`;
                        imgBase.style.backfaceVisibility = "hidden";
                        imgBase.style.transform = "none";
                        imgBase.style.willChange = "opacity";
                        wrap.appendChild(imgBase);

                        // Negra (hover)
                        let imgNegra = null;
                        if (logonegro) {
                            preload(logonegro);
                            imgNegra = document.createElement("img");
                            imgNegra.src = logonegro;
                            imgNegra.alt = `${name} (negro)`;
                            imgNegra.loading = "lazy";
                            imgNegra.decoding = "async";
                            imgNegra.style.position = "absolute";
                            imgNegra.style.inset = "0";
                            imgNegra.style.margin = "auto";
                            imgNegra.style.maxWidth = size;
                            imgNegra.style.maxHeight = size;
                            imgNegra.style.objectFit = "contain";
                            imgNegra.style.opacity = "0";
                            imgNegra.style.transform = "none";
                            imgNegra.style.willChange = "opacity";
                            imgNegra.style.transition = `opacity ${HOVER_MS}ms ${HOVER_EASE}`;
                            imgNegra.style.pointerEvents = "none";
                            imgNegra.style.backfaceVisibility = "hidden";
                            wrap.appendChild(imgNegra);
                        }

                        a.appendChild(wrap);
                        return { anchor: a, imgBase, imgNegra };
                    }

                    /* === Monta una celda =================================================== */
                    function mountLogo(cellId, { name, url, logo, logonegro, bgClass, sizePct }) {
                        const cell = document.getElementById(cellId);
                        if (!cell) return;

                        // Fondo base por clase
                        cell.classList.remove("bg-black", "bg-gray");
                        if (bgClass) cell.classList.add(bgClass);

                        // Limpiar
                        cell.innerHTML = "";

                        // Overlay dorado
                        const overlay = buildOverlay();
                        cell.appendChild(overlay);

                        // Anchor + doble imagen (acepta sizePct)
                        const { anchor, imgBase, imgNegra } = buildAnchor({ name, url, logo, logonegro, sizePct });
                        cell.appendChild(anchor);

                        // Hover sin efectos en imágenes (solo opacidad + overlay)
                        if (imgNegra) {
                            cell.addEventListener("pointerenter", () => {
                                overlay.style.opacity = "1";
                                imgBase.style.opacity = "0";
                                imgNegra.style.opacity = "1";
                            });
                            cell.addEventListener("pointerleave", () => {
                                overlay.style.opacity = "0";
                                imgBase.style.opacity = "1";
                                imgNegra.style.opacity = "0";
                            });
                        } else {
                            cell.addEventListener("pointerenter", () => { overlay.style.opacity = "1"; });
                            cell.addEventListener("pointerleave", () => { overlay.style.opacity = "0"; });
                        }

                        // Blindaje por si hay reglas globales de hover con transform
                        imgBase.style.setProperty("transform", "none", "important");
                        if (imgNegra) imgNegra.style.setProperty("transform", "none", "important");
                    }

                    /* === Revelado por scroll (grupal, secuencial y robusto) =============== */
                    function setupRevealGroups() {
                        // Marcar miembros de cada grupo
                        REVEAL_STEPS.forEach((ids, gIdx) => {
                            ids.forEach(id => {
                                const el = document.getElementById(id);
                                if (!el) return;
                                el.classList.add("reveal");
                                el.dataset.group = String(gIdx); // 0..N-1
                            });
                        });

                        let nextGroupToReveal = 0;

                        // Helper: ¿algún elemento del grupo está suficientemente visible?
                        function anyElementInViewport(groupIdx) {
                            const els = document.querySelectorAll(`.reveal[data-group="${groupIdx}"]`);
                            const vh = window.innerHeight || document.documentElement.clientHeight;
                            for (const el of els) {
                                const r = el.getBoundingClientRect();
                                const visibleH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
                                const needed = Math.max(1, 0.25 * r.height); // ~25% visible
                                if (visibleH >= needed) return true;
                            }
                            return false;
                        }

                        // Revela en orden tantos grupos como ya estén visibles (en cascada)
                        function drain() {
                            let progressed = false;
                            while (anyElementInViewport(nextGroupToReveal)) {
                                const ids = REVEAL_STEPS[nextGroupToReveal] || [];
                                ids.forEach(id => {
                                    const el = document.getElementById(id);
                                    if (el) el.classList.add("is-revealed");
                                });
                                nextGroupToReveal++;
                                progressed = true;
                            }
                            return progressed;
                        }

                        // Observa TODAS las celdas con reveal (no solo un “centinela”)
                        const io = new IntersectionObserver(
                            entries => {
                                // procesar de arriba hacia abajo
                                entries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                                for (const entry of entries) {
                                    if (!entry.isIntersecting) continue;
                                    const gIdx = Number(entry.target.dataset.group);
                                    if (gIdx === nextGroupToReveal) {
                                        drain(); // revela este y los siguientes si ya están visibles
                                    }
                                }
                            },
                            { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
                        );

                        document.querySelectorAll(".reveal").forEach(el => io.observe(el));

                        // Primer drenado por si hay grupos ya en viewport al cargar
                        drain();

                        // Recalcular en resize (por si cambian alturas y entran en viewport)
                        window.addEventListener("resize", () => { drain(); }, { passive: true });
                    }

                    /* === Render fijo + Rotación =========================================== */
                    let rotateTimer = null;


                    function renderDesktop() {
                        // Jovel (cell-jovel) e imágenes (cell-img1/cell-img2) quedan fijos por HTML/CSS
                        startRotationAllDesktop();   // ahora rotan TODAS las celdas de logo
                        setupRevealGroups();         // mantiene tu revelado secuencial
                    }

                    document.addEventListener("DOMContentLoaded", renderDesktop);

                    /* ====== Configuración general ====== */
                    const MOBILE_ROTATE_MS = 5000; // cada cuánto reubicar el rotatorio (edita a tu gusto)
                    const REVEAL_GROUPS_M = [
                        ["m-title"],
                        ["m-img1", "m-slot1"],           // grupo 1
                        ["m-slot2"],                    // grupo 2
                        ["m-slot3", "m-slot4", "m-slot6"],// grupo 3 (puedes ajustar)
                        ["m-slot5"]                     // grupo 4
                    ];

                    /* ====== FONDOS FIJOS POR CASILLA (no rotan) ======
                       Ajusta el patrón aquí si quieres cambiar el ajedrezado. */
                    const MOBILE_BG_BY_SLOT = {
                        "m-slot1": "bg-black",
                        "m-slot2": "bg-gray",
                        "m-slot3": "bg-gray",
                        "m-slot4": "bg-black",
                        "m-slot5": "bg-black", // Jovel dorado
                        "m-slot6": "bg-gray"
                    };

                    /* ====== Datos de aliados (solo contenido: name/url/logo) ======
                       OJO: Sin 'bg' aquí; los fondos vienen de MOBILE_BG_BY_SLOT. */
                    const MOBILE_ITEMS = {
                        "m-slot1": {
                            name: "Soluciones La Primavera",
                            url: "https://www.solucioneslaprimavera.com/",
                            logo: "https://i.imgur.com/3OZU62r.png",
                            sizePct: 80
                        },
                        // m-slot2 es el rotatorio (definido abajo)
                        "m-slot3": {
                            name: "Asuntos Inmobiliarios",
                            url: "https://www.facebook.com/figueroayasociadoshuila/?locale=es_LA",
                            logo: "https://i.imgur.com/Bgq3Q4D.png",
                            sizePct: 90
                        },
                        "m-slot4": {
                            name: "Inmobiliaria Rocha",
                            url: "https://rochafincaraiz.com/welcome/",
                            logo: "https://i.imgur.com/wjoVxSh.png",
                            sizePct: 70
                        },
                        "m-slot5": {
                            name: "Inmobiliaria Jovel Muñoz",
                            url: "https://www.inmobiliariajovelmunoz.com.co/",
                            logo: "https://i.imgur.com/YdhrBvG.png" // Jovel DORADO (móvil)
                        },
                        "m-slot6": {
                            name: "Casa Honor Inmobiliaria",
                            url: "https://casahonorinmobiliaria.com/",
                            logo: "https://i.imgur.com/QC7bWHR.png"
                        }
                    };

                    /* Ítems rotatorios: aparecerán uno a la vez, reubicándose aleatoriamente */
                    const MOBILE_ROTATORS = [
                        {
                            // (el que ya tenías)
                            name: "Inmobiliaria Santa María Vera",
                            url: "https://inmobiliariasantamariavera.com/",
                            logo: "https://i.imgur.com/JoMeVmg.png",
                            sizePct: 65
                        },
                        {
                            // NUEVO ALIADO ROTATORIO — reemplaza con tus datos reales
                            name: "JP",
                            url: "https://www.inmobiliariajpescobar.com.co/",
                            logo: "https://i.imgur.com/qplz1JN.png",
                            sizePct: 65
                        },
                        {
                            name: "Inmobiliaria Casa & Casa",
                            url: "https://casaycasainmobiliariadelhuila.com/",
                            logo: "https://i.imgur.com/lqq5aZK.png",
                            sizePct: 65
                        },
                        {
                            name: "Inmobiliaria Rustik House",
                            url: "https://inmobiliarianeiva.com/",
                            logo: "https://i.imgur.com/nZwIrQ9.png",
                            sizePct: 55
                        },
                        {
                            name: "Mac Negocios Inmobiliarios",
                            url: "https://web.facebook.com/people/MAC-negocios-Inmobiliarios/61581485549130/?_rdc=1&_rdr#",
                            logo: "https://i.imgur.com/yFrSt1J.png",
                            sizePct: 70
                        },
                        {
                            name: "Rediis",
                            url: "https://www.instagram.com/rediisarmiento/",
                            logo: "https://i.imgur.com/z7rH2Lc.png",
                            sizePct: 70
                        }, {
                            name: "Elite Group",
                            url: "https://inmobiliariaelitegroupsas.com/",
                            logo: "https://i.imgur.com/GUQR7li.png",
                            sizePct: 70
                        },
                        {
                            name: "Menber",
                            url: "https://casasenventaneiva.com/",
                            logo: "logoMenber dorado.webp",
                            sizePct: 80
                        }

                        /*
                    , {
                      name: "Inmobiliaria Felix Trujillo Falla",
                      url: "https://felixtrujillofalla.com/",
                      logo: "https://i.imgur.com/nQ0HCJA.png",
                      sizePct: 70
                    }
                    */
                    ];


                    /* ====== Helpers ====== */
                    function applyFixedBackgrounds() {
                        Object.entries(MOBILE_BG_BY_SLOT).forEach(([slotId, bgClass]) => {
                            const cell = document.getElementById(slotId);
                            if (!cell) return;
                            cell.classList.remove("bg-black", "bg-gray");
                            if (bgClass) cell.classList.add(bgClass);
                        });
                    }

                    function mountCell(cellId, { name, url, logo, sizePct = 72 }) {
                        const cell = document.getElementById(cellId);
                        if (!cell) return;
                        cell.innerHTML = "";

                        const a = document.createElement("a");
                        a.href = url; a.target = "_blank"; a.rel = "noopener";
                        a.setAttribute("aria-label", name);

                        const img = document.createElement("img");
                        img.src = logo;
                        img.alt = name;
                        img.loading = "lazy";
                        img.decoding = "async";
                        img.style.maxWidth = `${sizePct}%`;
                        img.style.maxHeight = `${sizePct}%`;
                        img.style.objectFit = "contain";

                        a.appendChild(img);
                        cell.appendChild(a);
                    }

                    /* Reparte el rotatorio en una casilla aleatoria:
                       - Por defecto va en m-slot2
                       - Si el destino aleatorio NO es m-slot2, intercambia los contenidos */


                    /* ==== Animación de entrada (grupal) ==== */
                    function setupRevealMobile() {
                        // marcar
                        REVEAL_GROUPS_M.forEach((ids) => {
                            ids.forEach(id => {
                                const el = document.getElementById(id);
                                if (!el) return;
                                el.classList.add("reveal-m");
                            });
                        });

                        let nextGroup = 0;

                        function isGroupVisible(idx) {
                            const ids = REVEAL_GROUPS_M[idx] || [];
                            const vh = window.innerHeight || document.documentElement.clientHeight;
                            return ids.some(id => {
                                const el = document.getElementById(id);
                                if (!el) return false;
                                const r = el.getBoundingClientRect();
                                const visibleH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
                                const needed = Math.max(1, 0.15 * r.height); // ~15% visible
                                return visibleH >= needed;
                            });
                        }

                        function drain() {
                            let progressed = false;
                            while (isGroupVisible(nextGroup)) {
                                (REVEAL_GROUPS_M[nextGroup] || []).forEach(id => {
                                    const el = document.getElementById(id);
                                    if (el) el.classList.add("is-revealed");
                                });
                                nextGroup++;
                                progressed = true;
                            }
                            return progressed;
                        }

                        const io = new IntersectionObserver(() => { drain(); }, { threshold: 0.1 });
                        document.querySelectorAll(".reveal-m").forEach(el => io.observe(el));
                        drain();
                        window.addEventListener("scroll", () => requestAnimationFrame(drain), { passive: true });
                        window.addEventListener("resize", () => requestAnimationFrame(drain), { passive: true });
                    }

                    /* ====== Rotación periódica SOLO de contenidos (no fondos) ====== */


                    /* ====== Render ====== */
                    function renderMobileAliados() {
                        // 1) Fijar fondos por casilla
                        applyFixedBackgrounds();


                        // 3) Pintado inicial + reveal
                        M_ROTATE_CELLS.forEach(paintMobileCell);
                        setupRevealMobile();

                        // 4) Rotación en todas (menos Jovel)
                        startMobileRotationAll();
                    }

                    document.addEventListener("DOMContentLoaded", () => {
                        const root = document.getElementById("aliados-m");
                        if (!root) return;
                        renderMobileAliados();
                    });

                    function uniqueBy(arr, keyFn) {
                        const seen = new Set();
                        return arr.filter(it => {
                            const k = keyFn(it);
                            if (seen.has(k)) return false;
                            seen.add(k);
                            return true;
                        });
                    }

                    /* Pool móvil: fijos (excepto Jovel m-slot5) + rotatorios */
                    // Pool móvil: TODOS los fijos (incluye Jovel de m-slot5) + rotatorios
                    const MOBILE_FIXED_ALL = Object.values(MOBILE_ITEMS);

                    const MOBILE_POOL = uniqueBy(
                        [...MOBILE_FIXED_ALL, ...MOBILE_ROTATORS],
                        it => `${it.name}|${it.url}|${it.logo}`
                    );

                    /* Slots que rotan (dejamos Jovel fijo en m-slot5) */
                    const M_ROTATE_CELLS = ["m-slot1", "m-slot2", "m-slot3", "m-slot4", "m-slot5", "m-slot6"];


                    const mState = M_ROTATE_CELLS.reduce((acc, id, i) => {
                        acc[id] = { idx: i % MOBILE_POOL.length };
                        return acc;
                    }, {});

                    function paintMobileCell(cellId) {
                        const data = MOBILE_POOL[mState[cellId].idx % MOBILE_POOL.length];
                        mountCell(cellId, data);
                    }

                    function tickMobileRotation() {
                        M_ROTATE_CELLS.forEach((cellId, j) => {
                            const cell = document.getElementById(cellId);
                            if (!cell) return;
                            setTimeout(() => {
                                cell.classList.add("fade-enter");
                                mState[cellId].idx = (mState[cellId].idx + 1) % MOBILE_POOL.length;
                                paintMobileCell(cellId);
                                requestAnimationFrame(() => cell.classList.add("fade-active"));
                                setTimeout(() => cell.classList.remove("fade-enter", "fade-active"), 300);
                            }, j * 60);
                        });
                    }

                    let mobileTimer = null;
                    function startMobileRotationAll() {
                        // Pintado inicial (Jovel fijo se monta aparte)
                        M_ROTATE_CELLS.forEach(paintMobileCell);
                        if (mobileTimer) clearInterval(mobileTimer);
                        mobileTimer = setInterval(tickMobileRotation, MOBILE_ROTATE_MS);
                    }
                    // ── BARRA MÓVIL ──
                    (function () {
                        const CAMPOS = [
                            { label: 'Tipo de inmueble', clave: 'Tipo de inmueble', selectId: 'filterTipoPropiedad' },
                            { label: 'Rango de precio', clave: 'Rango de precio', selectId: 'filterRangoPrecio' },
                            { label: 'Zona', clave: 'Zona', selectId: 'filterZona' },
                            { label: 'Habitaciones', clave: 'Habitaciones', selectId: 'filterHabitaciones' },
                            { label: 'Garaje', clave: 'Garaje', selectId: 'filterGaraje' },
                            { label: 'Pisos', clave: 'Pisos', selectId: 'filterPisos' },
                        ];

                        const inlinePanel = document.getElementById('movilFiltrosInline');
                        const inputBuscar = document.getElementById('movilBuscar');
                        const btnBuscar = document.getElementById('movilBuscarBtn');

                        // Estado local
                        const selMovil = {};
                        CAMPOS.forEach(c => selMovil[c.clave] = []);

                        const CAMPOS_MOVIL = [
                            { clave: 'Tipo de inmueble', dropId: 'movil-drop-tipo' },
                            { clave: 'Rango de precio',  dropId: 'movil-drop-precio' },
                            { clave: 'Zona',             dropId: 'movil-drop-zona' },
                            { clave: 'Habitaciones',     dropId: 'movil-drop-hab' },
                            { clave: 'Garaje',           dropId: 'movil-drop-garaje' },
                            { clave: 'Pisos',            dropId: 'movil-drop-pisos' },
                        ];

                        let inlineBuilt = false;

                        function construirInline() {
                            if (!inlinePanel) return;
                            if (typeof datos === 'undefined' || !datos.length) {
                                setTimeout(construirInline, 400);
                                return;
                            }
                            if (inlineBuilt) return;
                            inlineBuilt = true;

                            CAMPOS_MOVIL.forEach(({ clave, dropId }) => {
                                const drop = document.getElementById(dropId);
                                if (!drop) return;

                                let vals = [...new Set(datos.map(d => String(d[clave] ?? '')).filter(v => v && v !== 'undefined' && v !== ''))];
                                if (['Habitaciones','Garaje','Pisos'].includes(clave)) {
                                    vals = vals.map(Number).filter(v => !isNaN(v)).sort((a,b) => a-b).map(String);
                                } else { vals = vals.sort(); }

                                drop.innerHTML = vals.map(v => {
                                    const count = datos.filter(d => String(d[clave]) === v).length;
                                    return `<div class="fn-option" data-val="${v}">
                                        <span class="fn-chk"></span>${v}<span class="fn-count">(${count})</span>
                                    </div>`;
                                }).join('');

                                // Marcar activos
                                drop.querySelectorAll('.fn-option').forEach(opt => {
                                    if (selMovil[clave]?.includes(opt.dataset.val)) opt.classList.add('fn-sel');
                                });

                                // Eventos
                                drop.querySelectorAll('.fn-option').forEach(opt => {
                                    opt.addEventListener('click', e => {
                                        e.stopPropagation();
                                        const val = opt.dataset.val;
                                        if (!selMovil[clave]) selMovil[clave] = [];
                                        const idx = selMovil[clave].indexOf(val);
                                        if (idx === -1) selMovil[clave].push(val);
                                        else selMovil[clave].splice(idx, 1);
                                        opt.classList.toggle('fn-sel');
                                        // Actualizar label
                                        const head = drop.closest('.filtro-nuevo')?.querySelector('.fn-lbl');
                                        if (head) {
                                            const n = selMovil[clave].length;
                                            const base = { 'Tipo de inmueble':'Tipo de inmueble','Rango de precio':'Precio','Zona':'Zona','Habitaciones':'Habitaciones','Garaje':'Garaje','Pisos':'Pisos' };
                                            head.textContent = n ? `${base[clave]} (${n})` : base[clave];
                                        }
                                        CAMPOS.forEach(({ clave: c }) => { filtros[c] = selMovil[c]?.slice() || []; });
                                        aplicarFiltros();
                                        actualizarPill();
                                        actualizarLimpiarBtn();
                                    });
                                });
                            });

                            // ── ABRIR/CERRAR DROPDOWN INLINE (anclado al filtro, viaja con scroll) ──
                            let currentFiltroOpen = null;

                            function actualizarDropInline(filtroEl) {
                                const campo = filtroEl.dataset.campo;
                                const drop = filtroEl.querySelector('.filtro-nuevo-dropdown');
                                if (!drop) return;

                                // Marcar opciones activas
                                drop.querySelectorAll('.fn-option').forEach(opt => {
                                    opt.classList.toggle('fn-sel', !!selMovil[campo]?.includes(opt.dataset.val));
                                });

                                // Actualizar contadores fn-zero
                                if (typeof datos !== 'undefined') {
                                    const subset = datos.filter(d =>
                                        Object.keys(filtros).every(c => {
                                            if (c === campo) return true;
                                            if (!filtros[c] || filtros[c].length === 0) return true;
                                            return filtros[c].includes(String(d[c] ?? ''));
                                        })
                                    );
                                    drop.querySelectorAll('.fn-option').forEach(opt => {
                                        const val = opt.dataset.val;
                                        const count = subset.filter(d => String(d[campo] ?? '') === val).length;
                                        const countEl = opt.querySelector('.fn-count');
                                        if (countEl) countEl.textContent = `(${count})`;
                                        opt.classList.toggle('fn-zero', count === 0 && !opt.classList.contains('fn-sel'));
                                    });
                                }
                            }

                            inlinePanel.querySelectorAll('.filtro-nuevo-head').forEach(head => {
                                head.addEventListener('click', e => {
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    const filtroEl = head.closest('.filtro-nuevo');
                                    const isOpen = filtroEl === currentFiltroOpen;

                                    // Cerrar todos
                                    inlinePanel.querySelectorAll('.filtro-nuevo.fn-open').forEach(f => f.classList.remove('fn-open'));
                                    inlinePanel.querySelectorAll('.movil-bar.bar-open').forEach(b => b.classList.remove('bar-open'));
                                    currentFiltroOpen = null;

                                    if (!isOpen) {
                                        filtroEl.classList.add('fn-open');
                                        currentFiltroOpen = filtroEl;
                                        // Elevar la barra padre sobre las demás barras
                                        filtroEl.closest('.movil-bar')?.classList.add('bar-open');
                                        actualizarDropInline(filtroEl);
                                    }
                                });
                            });

                            // Cerrar al tocar fuera del panel
                            document.addEventListener('click', e => {
                                if (!e.target.closest('#movilFiltrosInline')) {
                                    inlinePanel.querySelectorAll('.filtro-nuevo.fn-open').forEach(f => f.classList.remove('fn-open'));
                                    inlinePanel.querySelectorAll('.movil-bar.bar-open').forEach(b => b.classList.remove('bar-open'));
                                    currentFiltroOpen = null;
                                }
                            }, { passive: true });

                            // Permitir scroll interno en dropdowns sin cerrar el panel
                            inlinePanel.addEventListener('touchmove', e => {
                                const drop = e.target.closest('.filtro-nuevo-dropdown');
                                if (drop) {
                                    e.stopPropagation();
                                }
                            }, { passive: true });
                        }

                        // Pill limpiar filtros (contador-wrapper)
                        const pill = document.getElementById('movilLimpiarPill');
                        const limpiarBtn = document.getElementById('movilLimpiarFiltrosBtn');

                        function anyMovilActive() {
                            return CAMPOS.some(({ clave }) => selMovil[clave].length > 0)
                                || (filtros['Buscar'] && filtros['Buscar'].trim() !== '');
                        }

                        function actualizarPill() {
                            if (!pill) return;
                            pill.style.display = anyMovilActive() ? 'inline-flex' : 'none';
                        }

                        function actualizarLimpiarBtn() {
                            if (!limpiarBtn) return;
                            limpiarBtn.style.display = anyMovilActive() ? 'block' : 'none';
                        }

                        function limpiarTodo() {
                            CAMPOS.forEach(({ clave }) => { selMovil[clave] = []; filtros[clave] = []; });
                            filtros['Buscar'] = '';
                            const bi = document.getElementById('movilBuscar');
                            if (bi) bi.value = '';
                            // Reset labels y selección visual
                            const labels = { 'Tipo de inmueble':'Tipo de inmueble','Rango de precio':'Precio','Zona':'Zona','Habitaciones':'Habitaciones','Garaje':'Garaje','Pisos':'Pisos' };
                            inlinePanel?.querySelectorAll('.filtro-nuevo').forEach(el => {
                                const campo = el.dataset.campo;
                                const lbl = el.querySelector('.fn-lbl');
                                if (lbl && labels[campo]) lbl.textContent = labels[campo];
                                el.querySelectorAll('.fn-option.fn-sel').forEach(o => o.classList.remove('fn-sel'));
                                el.classList.remove('fn-open');
                            });
                            aplicarFiltros();
                            actualizarPill();
                            actualizarLimpiarBtn();
                        }

                        pill?.addEventListener('click', limpiarTodo);
                        limpiarBtn?.addEventListener('click', limpiarTodo);

                        // Busqueda en tiempo real
                        inputBuscar.addEventListener('input', () => {
                            filtros['Buscar'] = inputBuscar.value.trim();
                            aplicarFiltros();
                            actualizarPill();
                            actualizarLimpiarBtn();
                        });
                        btnBuscar.addEventListener('click', () => {
                            filtros['Buscar'] = inputBuscar.value.trim();
                            aplicarFiltros();
                            actualizarPill();
                            actualizarLimpiarBtn();
                        });

                        // Construir al cargar datos
                        window._construirInline = function(force) {
                            if (force) inlineBuilt = false;
                            construirInline();
                        };

                    // ── LIGHTBOX ──
                    var lbFotos = [], lbIdx = 0;

                    window.lbIr = function lbIr(idx) {
                        lbIdx = ((idx % lbFotos.length) + lbFotos.length) % lbFotos.length;
                        document.getElementById('lightboxImg').src = lbFotos[lbIdx];
                        document.getElementById('lightboxCounter').textContent = (lbIdx+1) + ' / ' + lbFotos.length;
                        document.querySelectorAll('.lightbox-min').forEach(function(m,i){ m.classList.toggle('activa', i===lbIdx); });
                        var minActiva = document.querySelectorAll('.lightbox-min')[lbIdx];
                        if (minActiva) minActiva.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
                    }

                    window.lbAbrir = function(fotos, idx) {
                        lbFotos = fotos; lbIdx = idx || 0;
                        var mins = document.getElementById('lightboxMins');
                        mins.innerHTML = '';
                        fotos.forEach(function(url, i) {
                            var img = document.createElement('img');
                            img.src = url; img.className = 'lightbox-min'; img.loading = 'lazy';
                            img.addEventListener('click', function(){ lbIr(i); });
                            mins.appendChild(img);
                        });
                        var overlay = document.getElementById('lightboxOverlay');
                        overlay.classList.add('activo');
                        document.body.style.overflow = 'hidden';
                        // Registrar botones aquí donde ya existen
                        var btnClose = document.getElementById('lightboxClose');
                        var btnPrev  = document.getElementById('lightboxPrev');
                        var btnNext  = document.getElementById('lightboxNext');
                        if (btnClose && !btnClose._b) { btnClose._b=true; btnClose.addEventListener('click', function(e){ e.stopPropagation(); lbCerrar(); }); }
                        if (btnPrev  && !btnPrev._b)  { btnPrev._b=true;  btnPrev.addEventListener('click',  function(e){ e.stopPropagation(); lbIr(lbIdx-1); }); }
                        if (btnNext  && !btnNext._b)  { btnNext._b=true;  btnNext.addEventListener('click',  function(e){ e.stopPropagation(); lbIr(lbIdx+1); }); }
                        if (!overlay._b) { overlay._b=true; overlay.addEventListener('click', function(e){ if(e.target===overlay) lbCerrar(); }); }
                        // ── SWIPE LIGHTBOX ── (se registra una sola vez en el img-wrap)
                        var lbImgWrap = document.querySelector('#lightboxOverlay .lightbox-img-wrap');
                        if (lbImgWrap && !lbImgWrap._swipeInit) {
                            lbImgWrap._swipeInit = true;
                            var _lbTx = null, _lbTy = null, _lbMoved = false;
                            lbImgWrap.addEventListener('touchstart', function(e){
                                if (e.touches.length !== 1) return;
                                _lbTx = e.touches[0].clientX;
                                _lbTy = e.touches[0].clientY;
                                _lbMoved = false;
                            }, { passive: true });
                            lbImgWrap.addEventListener('touchmove', function(e){
                                if (_lbTx === null) return;
                                var dx = e.touches[0].clientX - _lbTx;
                                var dy = e.touches[0].clientY - _lbTy;
                                if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) _lbMoved = true;
                            }, { passive: true });
                            lbImgWrap.addEventListener('touchend', function(e){
                                if (!_lbMoved || _lbTx === null) { _lbTx = null; _lbMoved = false; return; }
                                var dx = e.changedTouches[0].clientX - _lbTx;
                                var dy = e.changedTouches[0].clientY - _lbTy;
                                _lbTx = null; _lbMoved = false;
                                if (Math.abs(dx) < 35 || Math.abs(dy) > Math.abs(dx)) return;
                                if (dx < 0) lbIr(lbIdx + 1); else lbIr(lbIdx - 1);
                            }, { passive: true });
                        }
                        lbIr(lbIdx);
                    }

                    window.lbCerrar = function() {
                        document.getElementById('lightboxOverlay').classList.remove('activo');
                        document.body.style.overflow = '';
                    }

                    document.addEventListener('keydown', function(e){ 
                        if (!document.getElementById('lightboxOverlay').classList.contains('activo')) return;
                        if (e.key==='Escape') lbCerrar();
                        if (e.key==='ArrowRight') lbIr(lbIdx+1);
                        if (e.key==='ArrowLeft') lbIr(lbIdx-1);
                    });

                        construirInline();
                    })();

                    // ── DRAG SCROLL MINIATURAS ──
                    (function(){
                        function initMinDrag() {
                            var el = document.getElementById('carruselMiniaturas');
                            if (!el || el._minDragInited) return;
                            el._minDragInited = true;
                            var down = false, startX = 0, scrollLeft = 0, moved = false;

                            el.addEventListener('mousedown', function(e){
                                down = true;
                                moved = false;
                                el._wasDragging = false;
                                startX = e.pageX - el.offsetLeft;
                                scrollLeft = el.scrollLeft;
                                el.classList.add('grabbing');
                            });

                            document.addEventListener('mouseup', function(){
                                if (down) {
                                    down = false;
                                    el.classList.remove('grabbing');
                                    if (moved) {
                                        el._wasDragging = true;
                                        setTimeout(function(){ el._wasDragging = false; }, 80);
                                    }
                                }
                            });

                            document.addEventListener('mousemove', function(e){
                                if (!down) return;
                                e.preventDefault();
                                var x = e.pageX - el.offsetLeft;
                                var walk = (x - startX) * 1.5;
                                if (Math.abs(walk) > 5) moved = true;
                                el.scrollLeft = scrollLeft - walk;
                            });

                            var touchStartX = 0, touchMoved = false;
                            el.addEventListener('touchstart', function(e){
                                if (e.touches.length === 1) {
                                    touchStartX = e.touches[0].clientX;
                                    touchMoved = false;
                                    el._wasDragging = false;
                                }
                            }, {passive: true});

                            el.addEventListener('touchmove', function(e){
                                if (e.touches.length === 1) {
                                    if (Math.abs(e.touches[0].clientX - touchStartX) > 8) {
                                        touchMoved = true;
                                        el._wasDragging = true;
                                    }
                                }
                            }, {passive: true});

                            el.addEventListener('touchend', function(){
                                if (touchMoved) {
                                    setTimeout(function(){ el._wasDragging = false; }, 80);
                                }
                            }, {passive: true});
                        }

                        var ov = document.getElementById('modalOverlay');
                        if (ov) new MutationObserver(function(){ initMinDrag(); })
                            .observe(ov, {attributes:true, attributeFilter:['style','class']});

                        if (document.readyState === 'loading') {
                            document.addEventListener('DOMContentLoaded', initMinDrag);
                        } else {
                            initMinDrag();
                        }
                    })();

                    // ─────────────────────────────────────────────────
                    // CO-CREACIÓN CLIENT JS PORTAL LOGIC
                    // ─────────────────────────────────────────────────
                    window.ccFeedback = {};
                    window.lid = null;
                    window.leadName = "";
                    const GAS_CC_URL = "https://script.google.com/macros/s/AKfycbzFUuzwKA_5C35NX7S2eniREyP8AAqqYxz4rUoL195-vfIuiis8KmG3IbKIojfywllI1w/exec";

                    // Inicializar Co-creación
                    (function initCocreacion() {
                        const params = new URLSearchParams(window.location.search);
                        const lidParam = params.get('lid');
                        if (!lidParam) return;
                        
                        window.lid = lidParam;
                        
                        // Cargar info del Lead (Nombre y Feedback previo)
                        const fetchUrl = `${GAS_CC_URL}?action=getLeadName&leadId=${encodeURIComponent(lidParam)}&t=${Date.now()}`;
                        fetch(fetchUrl)
                            .then(res => res.json())
                            .then(data => {
                                if (data && data.success) {
                                    window.leadName = data.name || "Cliente";
                                    window.ccFeedback = data.feedback || {};
                                    
                                    // Mostrar banner
                                    const banner = document.getElementById("cocreacionBanner");
                                    const leadNameEl = document.getElementById("ccLeadName");
                                    if (banner) {
                                        banner.style.display = "flex";
                                        if (leadNameEl) leadNameEl.textContent = window.leadName;
                                    }
                                    
                                    // Forzar renderizado para reflejar me gusta/descartar
                                    if (typeof renderizarTarjetas === "function") {
                                        renderizarTarjetas(typeof listaFiltrada !== 'undefined' ? listaFiltrada : datos);
                                    }
                                }
                            })
                            .catch(err => console.error("Error cargando Co-Creación:", err));
                    })();

                    // Enviar Feedback (LIKE / DISLIKE)
                    window.enviarCCFeedback = function(cod, type) {
                        if (!window.lid) return;
                        
                        const upperType = type.toUpperCase(); // 'LIKE' o 'DISLIKE'
                        const prevFeedback = window.ccFeedback[cod] || {};
                        const newInteres = prevFeedback.interes === upperType ? null : upperType; // Toggle off if clicked again
                        
                        // Optimistic update
                        if (!window.ccFeedback[cod]) window.ccFeedback[cod] = {};
                        window.ccFeedback[cod].interes = newInteres;
                        
                        // Update UI immediately
                        if (typeof renderizarTarjetas === "function") renderizarTarjetas(typeof listaFiltrada !== 'undefined' ? listaFiltrada : datos);
                        
                        // Update active modal if open
                        const activeModal = document.getElementById("modalOverlay");
                        if (activeModal && activeModal.style.display === "flex") {
                            const modalLike = document.getElementById("modalLike");
                            const modalDislike = document.getElementById("modalDislike");
                            if (modalLike) modalLike.classList.toggle("active", newInteres === 'LIKE');
                            if (modalDislike) modalDislike.classList.toggle("active", newInteres === 'DISLIKE');
                        }
                        
                        // Send to GAS
                        const postData = {
                            action: 'saveFeedback',
                            leadId: window.lid,
                            cod: cod,
                            type: newInteres ? newInteres.toLowerCase() : 'clear',
                            comment: prevFeedback.comentario || ''
                        };
                        
                        enviarFeedbackRemote(postData);
                    };

                    // Abrir Comentario Rápido en Tarjeta
                    window.abrirCCComentario = function(cod) {
                        if (!window.lid) return;
                        if (!window.ccFeedback[cod]) window.ccFeedback[cod] = {};
                        
                        // Toggle editing state
                        window.ccFeedback[cod]._editingComment = !window.ccFeedback[cod]._editingComment;
                        
                        // Update UI
                        if (typeof renderizarTarjetas === "function") renderizarTarjetas(typeof listaFiltrada !== 'undefined' ? listaFiltrada : datos);
                    };

                    // Guardar Comentario Rápido en Tarjeta
                    window.guardarCCComentario = function(cod) {
                        if (!window.lid) return;
                        
                        const inputEl = document.getElementById(`ccCommentInput-${cod}`);
                        if (!inputEl) return;
                        
                        const val = inputEl.value.trim();
                        if (!window.ccFeedback[cod]) window.ccFeedback[cod] = {};
                        window.ccFeedback[cod].comentario = val;
                        window.ccFeedback[cod]._editingComment = false; // Close box
                        
                        // Update UI
                        if (typeof renderizarTarjetas === "function") renderizarTarjetas(typeof listaFiltrada !== 'undefined' ? listaFiltrada : datos);
                        
                        // Send to GAS
                        const postData = {
                            action: 'saveFeedback',
                            leadId: window.lid,
                            cod: cod,
                            type: 'comment',
                            comment: val
                        };
                        
                        enviarFeedbackRemote(postData);
                    };

                    // Acciones desde el Modal Detallado
                    window.enviarCCFeedbackDesdeModal = function(type) {
                        const codEl = document.getElementById("modalCodigo");
                        if (!codEl) return;
                        const cod = codEl.textContent.trim();
                        if (!cod) return;
                        
                        window.enviarCCFeedback(cod, type);
                    };

                    window.abrirCCComentarioDesdeModal = function() {
                        const codEl = document.getElementById("modalCodigo");
                        if (!codEl) return;
                        const cod = codEl.textContent.trim();
                        if (!cod) return;
                        
                        if (!window.ccFeedback[cod]) window.ccFeedback[cod] = {};
                        window.ccFeedback[cod]._editingCommentModal = !window.ccFeedback[cod]._editingCommentModal;
                        
                        const commentBox = document.getElementById("modalCocreacionCommentBox");
                        if (commentBox) {
                            commentBox.style.display = window.ccFeedback[cod]._editingCommentModal ? "flex" : "none";
                            const commentInput = document.getElementById("modalCcCommentInput");
                            if (commentInput) {
                                commentInput.value = window.ccFeedback[cod].comentario || "";
                                if (window.ccFeedback[cod]._editingCommentModal) commentInput.focus();
                            }
                        }
                    };

                    window.guardarCCComentarioDesdeModal = function() {
                        const codEl = document.getElementById("modalCodigo");
                        if (!codEl) return;
                        const cod = codEl.textContent.trim();
                        if (!cod) return;
                        
                        const inputEl = document.getElementById("modalCcCommentInput");
                        if (!inputEl) return;
                        
                        const val = inputEl.value.trim();
                        if (!window.ccFeedback[cod]) window.ccFeedback[cod] = {};
                        window.ccFeedback[cod].comentario = val;
                        window.ccFeedback[cod]._editingCommentModal = false;
                        
                        // Hide box
                        const commentBox = document.getElementById("modalCocreacionCommentBox");
                        if (commentBox) commentBox.style.display = "none";
                        
                        // Update badge in modal comment button
                        const modalComment = document.getElementById("modalComment");
                        if (modalComment) {
                            modalComment.classList.toggle("has-comment", !!val);
                            modalComment.innerHTML = val ? '💬 Comentado' : '💬 Comentar';
                        }
                        
                        // Force render cards in background to update states
                        if (typeof renderizarTarjetas === "function") renderizarTarjetas(typeof listaFiltrada !== 'undefined' ? listaFiltrada : datos);
                        
                        // Send to GAS
                        const postData = {
                            action: 'saveFeedback',
                            leadId: window.lid,
                            cod: cod,
                            type: 'comment',
                            comment: val
                        };
                        
                        enviarFeedbackRemote(postData);
                    };

                    // Enviar de forma segura a Google Apps Script
                    function enviarFeedbackRemote(postData) {
                        const url = `${GAS_CC_URL}?action=saveFeedback`;
                        
                        fetch(url, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(postData)
                        }).catch(err => console.error("Error enviando feedback:", err));
                    }
         