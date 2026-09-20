

        var faqAcPage = 0;
        function mostrarPaginaAc(p) {
            if (p < 0 || p >= 3) return;
            faqAcPage = p;
            document.querySelectorAll('.faq-ac-item').forEach(function(el) {
                var show = parseInt(el.dataset.page) === p;
                el.style.display = show ? 'block' : 'none';
                if (!show) { el.classList.remove('open'); el.querySelector('.faq-ac-a').classList.remove('open'); }
            });
            for (var i=0; i<3; i++) {
                var d = document.getElementById('dot-a-'+i);
                if (d) d.classList.toggle('active', i===p);
            }
        }
        function irPaginaAc(p) { mostrarPaginaAc(p); }
        function toggleAc(btn) {
            var item = btn.closest('.faq-ac-item');
            var ans  = item.querySelector('.faq-ac-a');
            var isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-ac-item.open').forEach(function(el) {
                el.classList.remove('open'); el.querySelector('.faq-ac-a').classList.remove('open');
            });
            if (!isOpen) { item.classList.add('open'); ans.classList.add('open'); }
        }
        (function() { mostrarPaginaAc(0); })();

        function icdeToggle(title) {
            if (window.innerWidth > 700) return;
            const body = title.nextElementSibling;
            const isOpen = body.classList.contains('open');
            title.classList.toggle('open', !isOpen);
            body.classList.toggle('open', !isOpen);
        }
    