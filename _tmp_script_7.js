
            (function () {
                const overlay   = document.getElementById('introOverlay');
                const triangulo = document.getElementById('introTriangulo');
                if (!overlay || !triangulo) return;

                // Ocultar logo completo del header — solo se ve cuando el triángulo llega
                document.querySelectorAll('.logo').forEach(l => l.classList.add('intro-revelar'));

                function lanzarVuelo() {
                    // 1. Triángulo vuela (0.8s) — llega VISIBLE (opacity:1)
                    triangulo.classList.add('volando');

                    // 2. Cuando el triángulo llega (~800ms): overlay desaparece
                    //    y el logo completo aparece con texto deslizando
                    setTimeout(() => {
                        // Fade out del overlay al mismo tiempo
                        overlay.classList.add('oculto');

                        // Logo completo aparece: triángulo ya en posición,
                        // texto sale deslizando desde la izquierda
                        document.querySelectorAll('.logo').forEach(l => l.classList.add('intro-visible'));

                        // Revelar contenido de la página
                        ['.frase-container', '.bg'].forEach(sel => {
                            const el = document.querySelector(sel);
                            if (el) el.classList.add('icde-reveal');
                        });
                    }, 820);

                    // 3. Ocultar el triángulo animado una vez el logo real está visible
                    setTimeout(() => {
                        triangulo.style.opacity = '0';
                    }, 900);

                    // 4. Limpiar DOM
                    setTimeout(() => {
                        overlay.remove();
                        document.querySelectorAll('.logo').forEach(l => {
                            l.classList.remove('intro-revelar', 'intro-visible');
                        });
                    }, 1600);
                }

                setTimeout(lanzarVuelo, 350);
            })();
            