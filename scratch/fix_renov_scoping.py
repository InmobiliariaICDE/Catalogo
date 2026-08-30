with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

target_block = """                  // Si AL_DIA pero hay pagos PENDIENTES en meses PASADOS del año actual, mostrar como Futuro
                  if (pay.status === 'AL_DIA') {
                    const _viewY = parseInt(currentAdminYear, 10);
                    const _now = new Date();
                    const _nowY = _now.getFullYear();
                    const _nowM = _now.getMonth(); // 0-based
                    const hasPastPending = (p.payments[_viewY] || []).some((m, mIdx) => {
                      const isPast = _viewY < _nowY || (_viewY === _nowY && mIdx < _nowM);
                      return isPast && m.status === 'PENDING';
                    });
                    if (hasPastPending) pay = { ...pay, status: 'FUTURE' };
                  }
                  // Si es el mes de renovación y no está pagado o desocupado, marcar como NEW_CONTRACT para mostrar la estrella de renovación
                  if (isRenovMonth && (pay.status === 'PENDING' || pay.status === 'FUTURE' || pay.status === 'UNSTARTED')) {
                    pay = { ...pay, status: 'NEW_CONTRACT' };
                  }
                  let cellContent = '·';
                  if (pay.status === 'PAID') cellContent = '✓';
                  else if (pay.status === 'PENDING') cellContent = '$';
                  else if (pay.status === 'PREAVISO') cellContent = '⚠';
                  else if (pay.status === 'NEW_CONTRACT') cellContent = '★';
                  else if (pay.status === 'VACANT') cellContent = '-';
                  else if (pay.status === 'NO_RENEW') cellContent = '⌛';
                  else if (pay.status === 'DELIVERY') cellContent = '⛳';
                  else if (pay.status === 'AL_DIA') cellContent = '☀';

                  // Detectar si este mes es el mes de aniversario/renovación del contrato
                  let isRenovMonth = false;
                  if (p.start_date && p.start_date.includes('-')) {
                    const sMonthNum = parseInt(p.start_date.split('-')[1], 10);
                    const monthsArray = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                    if (monthsArray[sMonthNum - 1] === mFull) {
                      isRenovMonth = true;
                    }
                  }

                  const renovBadge = isRenovMonth ? ' | 📝 Mes de Renovación / Término de Contrato' : '';
                  const tooltipText = `${p.name} - ${mFull}: ${getStatusLabel(pay.status)}${renovBadge} ${pay.value && parseFloat(pay.value) > 0 ? safeFormatP(pay.value) : ''}`;"""

replacement_block = """                  // Detectar si este mes es el mes de aniversario/renovación del contrato
                  let isRenovMonth = false;
                  if (p.start_date && p.start_date.includes('-')) {
                    const sMonthNum = parseInt(p.start_date.split('-')[1], 10);
                    const monthsArray = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                    if (monthsArray[sMonthNum - 1] === mFull) {
                      isRenovMonth = true;
                    }
                  }

                  // Si AL_DIA pero hay pagos PENDIENTES en meses PASADOS del año actual, mostrar como Futuro
                  if (pay.status === 'AL_DIA') {
                    const _viewY = parseInt(currentAdminYear, 10);
                    const _now = new Date();
                    const _nowY = _now.getFullYear();
                    const _nowM = _now.getMonth(); // 0-based
                    const hasPastPending = (p.payments[_viewY] || []).some((m, mIdx) => {
                      const isPast = _viewY < _nowY || (_viewY === _nowY && mIdx < _nowM);
                      return isPast && m.status === 'PENDING';
                    });
                    if (hasPastPending) pay = { ...pay, status: 'FUTURE' };
                  }

                  // Si es el mes de renovación y no está pagado o desocupado, marcar como NEW_CONTRACT para mostrar la estrella de renovación
                  if (isRenovMonth && (pay.status === 'PENDING' || pay.status === 'FUTURE' || pay.status === 'UNSTARTED')) {
                    pay = { ...pay, status: 'NEW_CONTRACT' };
                  }

                  let cellContent = '·';
                  if (pay.status === 'PAID') cellContent = '✓';
                  else if (pay.status === 'PENDING') cellContent = '$';
                  else if (pay.status === 'PREAVISO') cellContent = '⚠';
                  else if (pay.status === 'NEW_CONTRACT') cellContent = '★';
                  else if (pay.status === 'VACANT') cellContent = '-';
                  else if (pay.status === 'NO_RENEW') cellContent = '⌛';
                  else if (pay.status === 'DELIVERY') cellContent = '⛳';
                  else if (pay.status === 'AL_DIA') cellContent = '☀';

                  const renovBadge = isRenovMonth ? ' | 📝 Mes de Renovación / Término de Contrato' : '';
                  const tooltipText = `${p.name} - ${mFull}: ${getStatusLabel(pay.status)}${renovBadge} ${pay.value && parseFloat(pay.value) > 0 ? safeFormatP(pay.value) : ''}`;"""

assert target_block in content, "target_block not found in admin.html"
content = content.replace(target_block, replacement_block)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Fixed variable order in admin.html!")
