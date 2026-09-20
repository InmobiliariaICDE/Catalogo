import os
import re

filepath = 'index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace main CSS block for #bannerComparar
css_pattern = re.compile(r'#bannerComparar\s*\{[^}]+\}\s*#btnComparar\s*\{[^}]+\}\s*#btnComparar:hover\s*\{[^}]+\}\s*#btnLimpiarComparar\s*\{[^}]+\}\s*#btnLimpiarComparar:hover\s*\{[^}]+\}', re.DOTALL)

css_replacement = """/* Botón comparar directo en cada tarjeta */
            .btn-card-comparar {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 5;
                height: 32px;
                padding: 0 10px;
                border-radius: 20px;
                background: rgba(0, 0, 0, 0.55);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                border: 1.5px solid rgba(255, 255, 255, 0.2);
                color: #fff;
                font-family: "Outfit", sans-serif;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                transition: all 0.25s ease;
            }
            .btn-card-comparar:hover {
                background: rgba(0, 0, 0, 0.8);
                border-color: rgba(212, 168, 75, 0.8);
                color: #d4a84b;
                transform: scale(1.05);
            }
            .btn-card-comparar.active {
                background: rgba(212, 168, 75, 0.9);
                border-color: #d4a84b;
                color: #000;
                font-weight: 700;
                box-shadow: 0 2px 10px rgba(212, 168, 75, 0.4);
            }

            /* Margen e inferencia cuando el banner de comparación está activo */
            body.has-banner-comparar .modal-overlay {
                padding-bottom: 110px !important;
            }
            body.has-banner-comparar .modal-contenido {
                margin-bottom: 40px !important;
            }
            body.has-banner-comparar #tarjetas {
                padding-bottom: 90px !important;
            }

            /* Banner Flotante Comparar */
            #bannerComparar {
                position: fixed;
                bottom: 12px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(28, 22, 15, 0.96) 0%, rgba(12, 10, 7, 0.98) 100%);
                border: 1.5px solid rgba(212, 168, 75, 0.6);
                padding: 8px 16px;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                z-index: 10008;
                color: #fff;
                max-width: 92%;
                width: 850px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .banner-comparar-body {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                gap: 10px;
            }

            .btn-toggle-banner {
                background: rgba(212, 168, 75, 0.2);
                border: 1px solid rgba(212, 168, 75, 0.4);
                color: #d4a84b;
                border-radius: 50%;
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;
                transition: all 0.2s ease;
            }
            .btn-toggle-banner:hover {
                background: rgba(212, 168, 75, 0.4);
                transform: scale(1.1);
            }

            #bannerComparar.minimized {
                padding: 6px 14px;
                width: auto;
                border-radius: 30px;
                background: rgba(28, 22, 15, 0.94);
            }
            #bannerComparar.minimized .miniaturas-comparar,
            #bannerComparar.minimized #btnLimpiarComparar {
                display: none !important;
            }
            #bannerComparar.minimized #btnComparar {
                padding: 4px 12px;
                font-size: 0.82rem;
            }
            #bannerComparar.minimized #iconToggleBanner {
                transform: rotate(180deg);
            }

            #btnComparar {
                background-color: #d4a84b;
                color: #000;
                padding: 8px 18px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 0.9rem;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            #btnComparar:hover {
                background-color: #e5b95c;
                transform: translateY(-1px);
            }

            #btnLimpiarComparar {
                background: rgba(255, 255, 255, 0.1);
                color: #e2e2e2;
                padding: 8px 14px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.85rem;
                border: 1px solid rgba(255, 255, 255, 0.2);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            #btnLimpiarComparar:hover {
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
            }

            @media (max-width: 600px) {
                .btn-card-comparar {
                    height: 28px;
                    padding: 0 8px;
                    font-size: 10px;
                    top: 6px;
                    right: 6px;
                }
                .btn-fav {
                    top: 6px;
                    left: 6px;
                }
                #bannerComparar {
                    bottom: 8px;
                    padding: 8px 10px;
                    border-radius: 14px;
                    max-width: 95%;
                }
                .banner-comparar-body {
                    gap: 6px;
                    flex-wrap: wrap;
                }
                #textoComparar {
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: #d4a84b;
                }
                .botonescontainer {
                    display: flex;
                    gap: 6px;
                    width: 100%;
                }
                #btnComparar, #btnLimpiarComparar {
                    flex: 1;
                    padding: 7px 8px;
                    font-size: 0.82rem;
                    text-align: center;
                }
            }"""

match_css = css_pattern.search(content)
assert match_css, "CSS pattern not matched"
content = content[:match_css.start()] + css_replacement + content[match_css.end():]

# 2. HTML replace for bannerComparar
html_pattern = re.compile(r'<div id="bannerComparar" class="banner-comparar hidden">.*?</div>', re.DOTALL)
html_replacement = """<div id="bannerComparar" class="banner-comparar hidden">
        <button id="btnToggleBannerComparar" class="btn-toggle-banner" title="Minimizar / Expandir banner" aria-label="Minimizar" onclick="toggleMinimizarBannerComparar()">
            <svg id="iconToggleBanner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="bannerCompararBody" class="banner-comparar-body">
            <!-- Miniaturas a la izquierda -->
            <div id="miniaturasComparar" class="miniaturas-comparar flex-shrink-0"></div>

            <!-- Texto centrado -->
            <div class="flex-1 text-center">
                <span id="textoComparar" class="block">Has seleccionado 0 propiedades</span>
            </div>

            <!-- Botones a la derecha -->
            <div class="botonescontainer flex gap-2">
                <button id="btnComparar" class="btn-comparar flex-1">Comparar</button>
                <button id="btnLimpiarComparar" class="btn-limpiare flex-1">Limpiar</button>
            </div>
        </div>
    </div>"""

match_html = html_pattern.search(content)
assert match_html, "HTML pattern not matched"
content = content[:match_html.start()] + html_replacement + content[match_html.end():]

# 3. Add btn-card-comparar in renderizarTarjetas
card_fav_pattern = re.compile(r'(<button class="btn-fav \$\{isFav \? \'active\' : \'\'\}" data-codigo="\$\{cod\}".*?</button>)', re.DOTALL)
match_card = card_fav_pattern.search(content)
assert match_card, "Card fav pattern not matched"

card_replacement = match_card.group(1) + """
                                                                                           <button class="btn-card-comparar ${comparaciones.includes(String(cod)) ? 'active' : ''}" data-codigo="${cod}" onclick="event.stopPropagation(); toggleCompararCard('${cod}')" title="${comparaciones.includes(String(cod)) ? 'Quitar de comparación' : 'Comparar esta propiedad'}" aria-label="Comparar">
                                                                                             <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 3h5v5M4 21h17M4 14h10M4 7h7"/></svg>
                                                                                             <span class="btn-card-comparar-text">${comparaciones.includes(String(cod)) ? 'En comparación' : 'Comparar'}</span>
                                                                                           </button>"""

content = content[:match_card.start()] + card_replacement + content[match_card.end():]

# 4. JS functions replace
js_pattern = re.compile(r'function enlazarComparar\(\)\s*\{.*?function mostrarComparacion\(ids\)\s*\{', re.DOTALL)
match_js = js_pattern.search(content)
assert match_js, "JS pattern not matched"

js_replacement = """function toggleCompararCard(codigo) {
                        const cod = String(codigo);
                        if (comparaciones.includes(cod)) {
                            comparaciones = comparaciones.filter(c => c !== cod);
                        } else {
                            if (comparaciones.length >= 2) {
                                alert('Solo puedes comparar hasta 2 propiedades a la vez.');
                                return;
                            }
                            comparaciones.push(cod);
                        }
                        sincronizarCompararUI();
                    }

                    function toggleMinimizarBannerComparar() {
                        const banner = document.getElementById('bannerComparar');
                        if (banner) {
                            banner.classList.toggle('minimized');
                        }
                    }

                    function sincronizarCompararUI() {
                        const banner = document.getElementById('bannerComparar');
                        const texto = document.getElementById('textoComparar');
                        const count = comparaciones.length;

                        document.body.classList.toggle('has-banner-comparar', count > 0);

                        if (texto) {
                            texto.textContent = `Has seleccionado ${count} propiedad(es)`;
                        }

                        if (banner) {
                            banner.classList.toggle('hidden', count === 0);
                        }

                        // Actualizar botones de tarjetas
                        document.querySelectorAll('.btn-card-comparar').forEach(btn => {
                            const c = String(btn.dataset.codigo);
                            const active = comparaciones.includes(c);
                            btn.classList.toggle('active', active);
                            const txtEl = btn.querySelector('.btn-card-comparar-text');
                            if (txtEl) txtEl.textContent = active ? 'En comparación' : 'Comparar';
                            btn.title = active ? 'Quitar de comparación' : 'Comparar esta propiedad';
                        });

                        // Actualizar checkbox en modal de detalle si está abierto
                        const _btnComparar = document.getElementById('modalChkComparar');
                        const _textoComparar = document.getElementById('modalCompararTexto');
                        if (_btnComparar) {
                            const _codActual = String(window._codigoActualModal || _btnComparar.dataset.codigo || '');
                            if (_codActual) {
                                const active = comparaciones.includes(_codActual);
                                _btnComparar.checked = active;
                                if (_textoComparar) {
                                    _textoComparar.textContent = active ? 'En comparación' : 'Comparar';
                                }
                            }
                        }

                        actualizarMiniaturas();
                    }

                    function enlazarComparar() {
                        const btn = document.getElementById('btnComparar');
                        const btnLimpiar = document.getElementById('btnLimpiarComparar');

                        if (btn) btn.onclick = () => mostrarComparacion(comparaciones);
                        if (btnLimpiar) btnLimpiar.onclick = limpiarComparaciones;

                        sincronizarCompararUI();
                    }

                    function actualizarBanner() {
                        sincronizarCompararUI();
                    }

                    function actualizarMiniaturas() {
                        const contenedor = document.getElementById('miniaturasComparar');
                        if (!contenedor) return;
                        contenedor.innerHTML = '';

                        comparaciones.forEach(codigo => {
                            const codStr = String(codigo);
                            const propObj = (Array.isArray(datos) ? datos.find(d => String(d["Código"]) === codStr) : null) || propiedades[codStr] || {};
                            
                            let imgUrl = propObj["Image"] || propObj.imagen || '';
                            if (!imgUrl && propObj["Imagenes"]) {
                                imgUrl = propObj["Imagenes"].split('').filter(c => c !== '\\r' && c !== '\\n').join('').split('|')[0].trim();
                            }
                            const nombreProp = propObj["Nombre"] || propObj.nombre || 'Propiedad ' + codStr;

                            const div = document.createElement('div');
                            div.className = 'chip-miniatura flex items-center';
                            div.style.cssText = 'background: rgba(212,168,75,0.2); padding: 3px 8px; border-radius: 8px; border: 1px solid rgba(212,168,75,0.4);';
                            div.innerHTML = `
                                <img loading="lazy" src="${imgUrl}" alt="${nombreProp}" class="chip-thumb" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px;" />
                                <span class="chip-code text-white font-semibold" style="margin: 0 5px; font-size: 11px;">#${codStr}</span>
                                <button class="btn-x-tooltip" data-codigo="${codStr}" onclick="event.stopPropagation(); toggleCompararCard('${codStr}')" style="background:none; border:none; color:#e11d48; font-size:16px; font-weight:bold; cursor:pointer; padding: 0 2px;">&times;</button>
                            `;
                            contenedor.appendChild(div);
                        });
                    }

                    function mostrarComparacion(ids) {"""

content = content[:match_js.start()] + js_replacement + content[match_js.end() - len('function mostrarComparacion(ids) {'):]

# 5. Modal abrirModal comparison logic
modal_pattern = re.compile(r'// Botón comparar en modal\s*var _btnComparar = document\.getElementById\(\'modalChkComparar\'\);.*?if \(banner\) banner\.classList\.toggle\(\'hidden\', comparaciones\.length === 0\);\s*\};', re.DOTALL)
match_modal = modal_pattern.search(content)
assert match_modal, "Modal pattern not matched"

modal_replacement = """// Botón comparar en modal
                        var _btnComparar = document.getElementById('modalChkComparar');
                        var _labelComparar = document.getElementById('modalLabelComparar');
                        var _textoComparar = document.getElementById('modalCompararTexto');
                        if (_btnComparar && _labelComparar) {
                            var _codigoActual = String(codigo);
                            window._codigoActualModal = _codigoActual;
                            _btnComparar.dataset.codigo = _codigoActual;
                            _btnComparar.checked = comparaciones.includes(_codigoActual);
                            if (_textoComparar) _textoComparar.textContent = _btnComparar.checked ? 'En comparación' : 'Comparar';
                            _btnComparar.onchange = function() {
                                toggleCompararCard(_codigoActual);
                            };
                        }"""

content = content[:match_modal.start()] + modal_replacement + content[match_modal.end():]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESSFULLY UPDATED index.html!")
