
    // Cargar Choices.js de forma no bloqueante
    (function(){
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js';
        s.onload = function(){ document.dispatchEvent(new Event('choicesReady')); };
        document.head.appendChild(s);
    })();
    