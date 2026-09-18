import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target_str = """                        // Datos del inmueble
                        const houseEmoji = String.fromCodePoint(0x1F3E0);
                        const linkEmoji = String.fromCodePoint(0x1F517);

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

                        // Construcción del mensaje de WhatsApp
                        let msg = `Hola ICDE Inmobiliaria ${houseEmoji}, quiero agendar una visita para ver el inmueble

`;
                        msg += `${nombreInmueble} (Cód. ${codInmueble}) - ${precioInmueble}

`;
                        msg += `${linkEmoji} Mi catálogo personalizado:
https://icdeinmobiliaria.com/?ids=${codInmueble}

`;"""

replacement_str = """                        // Datos del inmueble
                        const houseEmoji = String.fromCodePoint(0x1F3E0);
                        const linkEmoji = String.fromCodePoint(0x1F517);

                        let msg = "";

                        if (inmuebleAgendarActual && inmuebleAgendarActual.esFavoritos) {
                            msg += `Hola ICDE Inmobiliaria ${houseEmoji}

`;
                            msg += `Me interesan las siguientes propiedades y me gustaría *agendar una visita*:

`;
                            msg += inmuebleAgendarActual.lineas.join('\n');
                            msg += `

${linkEmoji} *Mi catálogo personalizado:*
${inmuebleAgendarActual.catalogoURL}

`;
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

                            msg += `Hola ICDE Inmobiliaria ${houseEmoji}, quiero agendar una visita para ver el inmueble

`;
                            msg += `${nombreInmueble} (Cód. ${codInmueble}) - ${precioInmueble}

`;
                            msg += `${linkEmoji} Mi catálogo personalizado:
https://icdeinmobiliaria.com/?ids=${codInmueble}

`;
                        }"""

if target_str in content:
    content = content.replace(target_str, replacement_str)
    print("Exact target_str replaced successfully!")
else:
    print("Error: target_str still not found")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved updated index.html successfully!")
