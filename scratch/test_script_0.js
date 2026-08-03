
// Suprime el diálogo "Esta página no puede cargar Google Maps correctamente"
(function() {
  const hide = () => {
    document.querySelectorAll('div[style*="z-index"]').forEach(el => {
      if (el.innerText && el.innerText.includes('Esta página no puede cargar Google Maps')) {
        el.style.display = 'none';
      }
    });
  };
  new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
})();
