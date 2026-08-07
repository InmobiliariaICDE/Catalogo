import os

admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace ensureUniqueIds in admin.html
start_tag = "function ensureUniqueIds(data) {"
end_tag = "return data;\n}"

start_pos = content.find(start_tag)
end_pos = content.find(end_tag, start_pos)

if start_pos != -1 and end_pos != -1:
    new_ensure_fn = """function ensureUniqueIds(data) {
  if (data && data.properties) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIdx = today.getMonth();

    data.properties.forEach(p => {
      if (p.excel_row) {
        p.id = String(p.excel_row);
      }

      if (p.payments) {
        const sortedYears = Object.keys(p.payments).map(Number).sort((a, b) => a - b);
        const chronologicalMonths = [];
        sortedYears.forEach(year => {
          p.payments[year].forEach((m, mIdx) => {
            chronologicalMonths.push({
              year,
              monthIdx: mIdx,
              cell: m
            });
          });
        });

        const paidIndices = [];
        const deliveryIndices = [];

        chronologicalMonths.forEach((item, idx) => {
          const m = item.cell;
          const valUpper = String(m.value).trim().toUpperCase();
          const numVal = parseFloat(String(m.value).replace(/[^0-9.]/g, ''));
          const isPaidCell = (!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO');
          const isDeliveryCell = m.status === 'DELIVERY' || valUpper.includes('ENTREGA');

          if (isPaidCell) {
            paidIndices.push(idx);
          } else if (isDeliveryCell) {
            deliveryIndices.push(idx);
          }
        });

        const hasAnyPayment = paidIndices.length > 0;
        const maxPaidIdx = hasAnyPayment ? Math.max(...paidIndices) : -1;

        let startDt = null;
        if (p.start_date) {
          const sStr = String(p.start_date).trim();
          if (sStr.includes('-')) {
            const parts = sStr.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) startDt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
              else startDt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 1);
            }
          } else if (sStr.includes('/')) {
            const parts = sStr.split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) startDt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 1);
              else startDt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            }
          }
        }
        let durationMonths = parseInt(p.duration, 10) || 12;
        const hasTenant = p.tenant_name && String(p.tenant_name).trim() !== '';
        const isVacantByName = p.name && String(p.name).toUpperCase().includes('DESOCUPAD');

        let dynamicOverallStatus = (isVacantByName || (!hasAnyPayment && !hasTenant && !startDt)) ? 'Desocupado' : 'Ocupado';

        chronologicalMonths.forEach((item, idx) => {
          const m = item.cell;
          const y = item.year;
          const mIdx = item.monthIdx;
          const valUpper = String(m.value).trim().toUpperCase();
          const numVal = parseFloat(String(m.value).replace(/[^0-9.]/g, ''));
          const isPaidCell = (!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO');
          const isDeliveryCell = m.status === 'DELIVERY' || valUpper.includes('ENTREGA');
          const isVacantCell = (m.status === 'VACANT' || valUpper.includes('DESOCUPAD')) && !isPaidCell;

          const lastDelivery = deliveryIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);
          const lastPaid = paidIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);

          const mDate = new Date(y, mIdx, 1);
          let isBeforeStart = false;
          let isAfterEnd = false;
          if (startDt) {
            const cStart = new Date(startDt.getFullYear(), startDt.getMonth(), 1);
            const cEnd = new Date(startDt.getFullYear(), startDt.getMonth() + durationMonths, 1);
            if (mDate < cStart) isBeforeStart = true;
            if (mDate >= cEnd) isAfterEnd = true;
          }

          const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
          const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));

          if (isPaidCell) {
            // Keep PAID / NEW_CONTRACT
          } else if (isDeliveryCell) {
            m.status = 'DELIVERY';
          } else if (isBeforeStart || isAfterEnd || isVacantByName || (!hasTenant && !startDt && !hasAnyPayment)) {
            m.status = 'VACANT';
            m.value = 'DESOCUPADO';
          } else if (isFuture) {
            m.status = 'FUTURE';
            m.value = '-';
          } else if (isCurrent) {
            if (m.status === 'VACANT' && !hasTenant && !startDt && !hasAnyPayment) {
              m.status = 'VACANT';
              m.value = 'DESOCUPADO';
            } else {
              const todayDay = today.getDate();
              const limitDay = (p.due_day && p.due_day > 0) ? p.due_day : 5;
              if (todayDay < limitDay) {
                m.status = 'AL_DIA';
              } else {
                m.status = 'PENDING';
              }
              m.value = '-';
            }
          } else {
            // Past month during active contract
            if (isVacantCell && !hasTenant && !startDt) {
              m.status = 'VACANT';
              m.value = 'DESOCUPADO';
            } else {
              m.status = 'PENDING';
              m.value = '-';
            }
          }

          if (isCurrent) {
            dynamicOverallStatus = (m.status === 'VACANT') ? 'Desocupado' : 'Ocupado';
          }
        });
        p.status = dynamicOverallStatus;
      }
    });
  }
  return data;
}"""
    content = content[:start_pos] + new_ensure_fn + content[end_pos + len(end_tag):]
    print("Updated ensureUniqueIds in admin.html!")

# 2. Update filter chips in admin.html
old_chips = """<div id="adminFiltersContainer" style="display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap;">
          <button class="chip-filtro ${currentAdminFilter==='todos'?'sel':''}" data-filter="todos" onclick="setAdminFilter('todos')">Todos</button>
          <button class="chip-filtro ${currentAdminFilter==='ocupados'?'sel':''}" data-filter="ocupados" onclick="setAdminFilter('ocupados')">🟢 Ocupados</button>
          <button class="chip-filtro ${currentAdminFilter==='disponibles'?'sel':''}" data-filter="disponibles" onclick="setAdminFilter('disponibles')">🟡 Disponibles</button>
        </div>"""

new_chips = """<div id="adminFiltersContainer" style="display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap;">
          <button class="chip-filtro ${currentAdminFilter==='todos'?'sel':''}" data-filter="todos" onclick="setAdminFilter('todos')">Todos</button>
          <button class="chip-filtro ${currentAdminFilter==='pendientes'?'sel':''}" data-filter="pendientes" onclick="setAdminFilter('pendientes')">🔴 Pendientes</button>
          <button class="chip-filtro ${currentAdminFilter==='aldia'?'sel':''}" data-filter="aldia" onclick="setAdminFilter('aldia')">☀️ Al día</button>
          <button class="chip-filtro ${currentAdminFilter==='pagados'?'sel':''}" data-filter="pagados" onclick="setAdminFilter('pagados')">🟢 Pagados</button>
          <button class="chip-filtro ${currentAdminFilter==='ocupados'?'sel':''}" data-filter="ocupados" onclick="setAdminFilter('ocupados')">Ocupados</button>
          <button class="chip-filtro ${currentAdminFilter==='disponibles'?'sel':''}" data-filter="disponibles" onclick="setAdminFilter('disponibles')">⚪ Desocupados</button>
        </div>"""

content = content.replace(old_chips, new_chips)

# 3. Update sort dropdown in admin.html
old_sort_select = """<option value="nombre" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'nombre' ? 'selected' : ''}>Nombre</option>
            <option value="precio" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'precio' ? 'selected' : ''}>Precio</option>
            <option value="propietario" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'propietario' ? 'selected' : ''}>Propietario</option>
            <option value="disponibles" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'disponibles' ? 'selected' : ''}>Disponibles</option>
            <option value="ocupados" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'ocupados' ? 'selected' : ''}>Ocupados</option>
            <option value="fecha_inicio" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'fecha_inicio' ? 'selected' : ''}>Día de pago</option>"""

new_sort_select = """<option value="nombre" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'nombre' ? 'selected' : ''}>Nombre</option>
            <option value="pendientes" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'pendientes' ? 'selected' : ''}>🔴 Pendiente de Pago</option>
            <option value="aldia" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'aldia' ? 'selected' : ''}>☀️ Al Día</option>
            <option value="precio" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'precio' ? 'selected' : ''}>Precio</option>
            <option value="propietario" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'propietario' ? 'selected' : ''}>Propietario</option>
            <option value="disponibles" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'disponibles' ? 'selected' : ''}>Disponibles</option>
            <option value="ocupados" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'ocupados' ? 'selected' : ''}>Ocupados</option>
            <option value="fecha_inicio" style="background-color: #121212; color: #fff;" ${currentAdminSort === 'fecha_inicio' ? 'selected' : ''}>Día de pago</option>"""

content = content.replace(old_sort_select, new_sort_select)

# 4. Update renderAdministracionContent filtering and sorting logic
old_filter_logic = """    const occupied = isOccupied(p);
    if (currentAdminFilter === 'ocupados') return occupied;
    if (currentAdminFilter === 'disponibles') return !occupied;
    return true; // 'todos'"""

new_filter_logic = """    const getMonthStatus = (prop) => {
      const paymentsYear = prop.payments[currentAdminYear] || [];
      const payMonth = paymentsYear.find(m => m.month === currentAdminMonth);
      return payMonth ? payMonth.status : 'VACANT';
    };

    const statusMonth = getMonthStatus(p);
    const occupied = isOccupied(p);

    if (currentAdminFilter === 'ocupados') return occupied;
    if (currentAdminFilter === 'disponibles') return !occupied;
    if (currentAdminFilter === 'pendientes') return statusMonth === 'PENDING';
    if (currentAdminFilter === 'aldia') return statusMonth === 'AL_DIA';
    if (currentAdminFilter === 'pagados') return statusMonth === 'PAID' || statusMonth === 'NEW_CONTRACT';
    return true;"""

content = content.replace(old_filter_logic, new_filter_logic)

old_sort_logic = """    if (currentAdminSort === 'propietario') {
      return (a.owner || '').localeCompare(b.owner || '');
    }"""

new_sort_logic = """    if (currentAdminSort === 'propietario') {
      return (a.owner || '').localeCompare(b.owner || '');
    }
    if (currentAdminSort === 'pendientes') {
      const getMonthStatus = (prop) => {
        const paymentsYear = prop.payments[currentAdminYear] || [];
        const payMonth = paymentsYear.find(m => m.month === currentAdminMonth);
        return payMonth ? payMonth.status : 'VACANT';
      };
      const aPend = getMonthStatus(a) === 'PENDING' ? 1 : 0;
      const bPend = getMonthStatus(b) === 'PENDING' ? 1 : 0;
      if (aPend !== bPend) return bPend - aPend;
      return a.name.localeCompare(b.name);
    }
    if (currentAdminSort === 'aldia') {
      const getMonthStatus = (prop) => {
        const paymentsYear = prop.payments[currentAdminYear] || [];
        const payMonth = paymentsYear.find(m => m.month === currentAdminMonth);
        return payMonth ? payMonth.status : 'VACANT';
      };
      const aDia = getMonthStatus(a) === 'AL_DIA' ? 1 : 0;
      const bDia = getMonthStatus(b) === 'AL_DIA' ? 1 : 0;
      if (aDia !== bDia) return bDia - aDia;
      return a.name.localeCompare(b.name);
    }"""

content = content.replace(old_sort_logic, new_sort_logic)

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating admin.html filter and sort controls!")
