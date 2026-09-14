

function parseAdminStartDate(dStr) {
  if (!dStr || typeof dStr !== 'string') return null;
  const str = dStr.trim();
  if (!str) return null;
  if (str.match(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/)) {
    const parts = str.split(/[-\/]/);
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
  }
  if (str.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/)) {
    const parts = str.split(/[-\/]/);
    return { year: parseInt(parts[2], 10), month: parseInt(parts[1], 10), day: parseInt(parts[0], 10) };
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  return null;
}

function calculateAdminEndDate(startDateStr, durationMonths) {
  const parsed = parseAdminStartDate(startDateStr);
  if (!parsed) return null;
  const dur = parseInt(durationMonths, 10) || 12;
  let endMonth = parsed.month + dur;
  let endYear = parsed.year;
  while (endMonth > 12) {
    endMonth -= 12;
    endYear += 1;
  }
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(endMonth).padStart(2, '0');
  return `${endYear}-${mm}-${dd}`;
}

function findAdminProperty(propId, propName) {
  if (!adminData || !Array.isArray(adminData.properties)) return null;
  const targetId = (propId !== undefined && propId !== null) ? String(propId).trim() : '';
  const targetName = (propName !== undefined && propName !== null) ? String(propName).trim().toLowerCase() : '';
  
  if (targetId) {
    const foundById = adminData.properties.find(x => String(x.id).trim() === targetId);
    if (foundById) return foundById;
  }
  
  if (targetName) {
    const foundByName = adminData.properties.find(x => String(x.name).trim().toLowerCase() === targetName);
    if (foundByName) return foundByName;
  }
  
  return null;
}

function syncPropertyContractMonths(p) {
  if (!p || !p.start_date) return;
  const parsed = parseAdminStartDate(p.start_date);
  if (!parsed || parsed.month < 1 || parsed.month > 12 || !parsed.year) return;
  const monthsArray = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const startMonthIdx = parsed.month - 1;
  const startYear = parsed.year;
  const dur = parseInt(p.duration, 10) || 12;
  
  if (!p.payments) p.payments = {};
  
  Object.keys(p.payments).forEach(yrStr => {
    if (!Array.isArray(p.payments[yrStr])) return;
    const yr = parseInt(yrStr, 10);
    p.payments[yrStr].forEach(mitem => {
      const mIdx = monthsArray.indexOf(mitem.month);
      if (mIdx !== -1) {
        const totalMonthsDiff = (yr - startYear) * 12 + (mIdx - startMonthIdx);
        const isRenov = (totalMonthsDiff > 0 && (totalMonthsDiff % dur) === 0);
        
        if (isRenov) {
          if (!["PAID", "PREAVISO", "DELIVERY", "NO_RENEW"].includes(mitem.status)) {
            mitem.status = "NEW_CONTRACT";
            mitem.value = "CONTRATO NUEVO";
          }
        } else {
          if (mitem.status === "NEW_CONTRACT") {
            mitem.status = p.tenant_name ? "PENDING" : "VACANT";
            mitem.value = p.tenant_name ? "Pendiente" : "DESOCUPADO";
          }
        }
      }
    });
  });
}

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
