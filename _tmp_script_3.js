
        (function () {
            // imgW/imgH: desktop | mW/mH: móvil
            const LW_PARTNERS = [
                { name: "Elite Group", url: "https://inmobiliariaelitegroupsas.com/", logo: "https://i.imgur.com/YjlzFt7.png", logoDark: "https://i.imgur.com/JJtX3bZ.png", imgW: 190, imgH: 105, mW: 95, mH: 52 },
                { name: "Soluciones La Primavera", url: "https://www.solucioneslaprimavera.com/", logo: "https://i.imgur.com/PsiEbKP.png", logoDark: "https://i.imgur.com/uB9GTVP.png", imgW: 220, imgH: 105, mW: 110, mH: 52 },
                { name: "Rocha Finca Raíz", url: "https://rochafincaraiz.com/welcome/", logo: "https://i.imgur.com/iz2EzJy.png", logoDark: "https://i.imgur.com/MBx9se5.png", imgW: 190, imgH: 105, mW: 95, mH: 52 },
                { name: "Inmobiliaria Jovel Muñoz", url: "https://www.inmobiliariajovelmunoz.com.co/", logo: "https://i.imgur.com/fuzfa6Q.png", logoDark: "https://i.imgur.com/wlVGPRO.png", imgW: 110, imgH: 115, mW: 55, mH: 58 },
                { name: "Inmobiliaria Santa María Vera", url: "https://inmobiliariasantamariavera.com/", logo: "https://i.imgur.com/b7octxb.png", logoDark: "https://i.imgur.com/SLxcuZg.png", imgW: 150, imgH: 105, mW: 75, mH: 52 },
                { name: "MAC Negocios Inmobiliarios", url: "https://web.facebook.com/people/MAC-negocios-Inmobiliarios/61581485549130/", logo: "https://i.imgur.com/ZANbYSq.png", logoDark: "https://i.imgur.com/K4rlA5d.png", imgW: 175, imgH: 105, mW: 88, mH: 52 },
                { name: "Inmobiliaria JP Escobar", url: "https://www.inmobiliariajpescobar.com.co/", logo: "https://i.imgur.com/UqCW2f9.png", logoDark: "https://i.imgur.com/zX0E5Xa.png", imgW: 140, imgH: 78, mW: 95, mH: 53 },
                { name: "Asuntos Inmobiliarios", url: "https://www.facebook.com/figueroayasociadoshuila/?locale=es_LA", logo: "https://i.imgur.com/KiJR205.png", logoDark: "https://i.imgur.com/jIrCvpA.png", imgW: 175, imgH: 105, mW: 88, mH: 52 },
                { name: "Casa Honor Inmobiliaria", url: "https://casahonorinmobiliaria.com/", logo: "https://i.imgur.com/O9JTNp1.png", logoDark: "https://i.imgur.com/NJg5trf.png", imgW: 175, imgH: 105, mW: 88, mH: 52 },
                { name: "Rediis Armiento", url: "https://www.instagram.com/rediisarmiento/", logo: "https://i.imgur.com/JMpRddV.png", logoDark: "https://i.imgur.com/Qaplx48.png", imgW: 160, imgH: 105, mW: 80, mH: 52 },
                { name: "Inmobiliaria Casa & Casa", url: "https://casaycasainmobiliariadelhuila.com/", logo: "https://i.imgur.com/0dQ8aDF.png", logoDark: "https://i.imgur.com/MSp82by.png", imgW: 175, imgH: 105, mW: 88, mH: 52 },
                { name: "Inmobiliaria Rustik House", url: "https://inmobiliarianeiva.com/", logo: "https://i.imgur.com/ROqM8YO.png", logoDark: "https://i.imgur.com/H0RNhOG.png", imgW: 190, imgH: 105, mW: 95, mH: 52 },
                { name: "Menber", url: "https://casasenventaneiva.com/", logo: "logoMenber dorado.webp", logoDark: "logoMenber Blanco.webp", imgW: 175, imgH: 105, mW: 88, mH: 52 }
            ];

            const track = document.getElementById('lwTrack');
            if (!track) return;

            const isMobile = () => window.innerWidth <= 640;

            function makeItem(p) {
                const mobile = isMobile();
                const w = mobile ? p.mW : p.imgW;
                const h = mobile ? p.mH : p.imgH;

                const item = document.createElement('div');
                item.className = 'lw-item';

                const a = document.createElement('a');
                a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.setAttribute('aria-label', p.name);

                const inner = document.createElement('div');
                inner.className = 'lw-item-inner';
                inner.style.width = w + 'px';
                inner.style.height = h + 'px';

                const g = document.createElement('img');
                g.src = p.logo; g.alt = p.name; g.className = 'lw-logo-gold';
                g.loading = 'lazy'; g.decoding = 'async';
                g.style.width = w + 'px';
                g.style.height = h + 'px';

                const d = document.createElement('img');
                d.src = p.logoDark; d.alt = ''; d.className = 'lw-logo-dark';
                d.loading = 'lazy'; d.decoding = 'async'; d.setAttribute('aria-hidden', 'true');
                d.style.width = w + 'px';
                d.style.height = h + 'px';

                inner.appendChild(g); inner.appendChild(d);
                a.appendChild(inner); item.appendChild(a);
                return item;
            }

            [...LW_PARTNERS, ...LW_PARTNERS].forEach(p => track.appendChild(makeItem(p)));
        })();
    