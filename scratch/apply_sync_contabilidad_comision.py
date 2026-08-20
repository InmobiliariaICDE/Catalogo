import os

admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """  if (typeof adminData !== 'undefined' && adminData && adminData.properties) {
    const monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    adminData.properties.forEach(p => {
      const rent = parseFloat(p.monthly_rent) || 0;
      const comVal = rent * 0.10;
      if (comVal <= 0) return;
      
      const paymentsYear = (p.payments && p.payments[year]) ? p.payments[year] : [];
      paymentsYear.forEach(m => {
        const mIdx = monthsNames.indexOf(m.month.toUpperCase());
        if (mIdx !== -1) {
          const st = m.status;
          if (st === 'PAID') {
            const propName = p.name || 'Propiedad';
            const mIdx1Based = mIdx + 1;
            lista.push({
              id: 'AUTO-ADMIN-COMISION-' + (p.id || propName.replace(/\s+/g, '-')) + '-' + year + '-' + mIdx1Based,
              tipo: 'ingreso',
              categoria: 'Gestión/Administración',
              descripcion: 'Comisión Administración - ' + propName,
              monto: comVal,
              fecha: year + '-' + String(mIdx1Based).padStart(2, '0') + '-01',
              mes: mIdx1Based,
              ano: year,
              notas: 'Generado automáticamente para el inmueble: ' + propName,
              isAuto: true
            });
          }
        }
      });
    });
  }"""

new_code = """  if (typeof adminData !== 'undefined' && adminData && adminData.properties) {
    const monthsNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    adminData.properties.forEach(p => {
      const rent = parseFloat(p.monthly_rent) || 0;
      const paymentsYear = (p.payments && p.payments[year]) ? p.payments[year] : [];
      paymentsYear.forEach(m => {
        const mIdx = monthsNames.indexOf(m.month.toUpperCase());
        if (mIdx !== -1) {
          const st = m.status;
          const val = parseFloat(m.value) || 0;
          let recaudado = 0;
          if (st === 'PAID') {
            recaudado = val > 0 ? val : rent;
          } else if (['PREAVISO', 'NEW_CONTRACT', 'NO_RENEW', 'AL_DIA', 'DELIVERY'].includes(st)) {
            if (val > 0) recaudado = val;
          }

          const comVal = recaudado * 0.10;
          if (comVal > 0) {
            const propName = p.name || 'Propiedad';
            const mIdx1Based = mIdx + 1;
            lista.push({
              id: 'AUTO-ADMIN-COMISION-' + (p.id || propName.replace(/\s+/g, '-')) + '-' + year + '-' + mIdx1Based,
              tipo: 'ingreso',
              categoria: 'Gestión/Administración',
              descripcion: 'Comisión Administración - ' + propName,
              monto: comVal,
              fecha: year + '-' + String(mIdx1Based).padStart(2, '0') + '-01',
              mes: mIdx1Based,
              ano: year,
              notas: 'Generado automáticamente para el inmueble: ' + propName,
              isAuto: true
            });
          }
        }
      });
    });
  }"""

if old_code in content:
    content = content.replace(old_code, new_code)
    print("Successfully replaced contGetParaAno commission logic in admin.html!")
else:
    print("ERROR: old_code not found in admin.html!")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done applying sync contabilidad comision!")
