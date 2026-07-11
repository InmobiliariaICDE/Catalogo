file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the ensureUniqueIds definition
old_function = """function ensureUniqueIds(data) {
  if (data && data.properties) {
    data.properties.forEach(p => {
      if (p.excel_row) {
        p.id = String(p.excel_row);
      }
    });
  }
  return data;
}"""

new_function = """function ensureUniqueIds(data) {
  if (data && data.properties) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentYearStr = String(currentYear);
    const currentMonthIdx = today.getMonth();

    data.properties.forEach(p => {
      if (p.excel_row) {
        p.id = String(p.excel_row);
      }

      // Self-healing rules for overall status and future months
      if (p.payments) {
        // 1. Determine overall status dynamically:
        // By default 'Ocupado', unless the current month cell is VACANT.
        let dynamicOverallStatus = 'Ocupado';
        if (p.name && String(p.name).toUpperCase().includes('DESOCUPAD')) {
          dynamicOverallStatus = 'Desocupado';
        } else {
          // Check current month status
          const currentPayments = p.payments[currentYearStr];
          if (currentPayments && currentPayments[currentMonthIdx]) {
            if (currentPayments[currentMonthIdx].status === 'VACANT') {
              dynamicOverallStatus = 'Desocupado';
            }
          }
        }
        p.status = dynamicOverallStatus;

        // 2. Propagate status based on overall status:
        if (dynamicOverallStatus === 'Desocupado') {
          // If desocupado, future/pending months with empty values become VACANT
          Object.keys(p.payments).forEach(year => {
            p.payments[year].forEach(m => {
              if ((m.status === 'PENDING' || m.status === 'AL_DIA' || m.status === 'FUTURE') && (m.value === '-' || m.value === '')) {
                m.status = 'VACANT';
                m.value = 'DESOCUPADO';
              }
            });
          });
        } else {
          // If ocupado, any future VACANT cells become FUTURE
          Object.keys(p.payments).forEach(year => {
            p.payments[year].forEach((m, mIdx) => {
              const y = parseInt(year, 10);
              const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
              const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));

              if (m.status === 'VACANT' && (isCurrent || isFuture)) {
                if (isCurrent) {
                  const todayDay = today.getDate();
                  const limitDay = (p.due_day && p.due_day > 0) ? p.due_day : 1;
                  if (todayDay < limitDay) {
                    m.status = 'AL_DIA';
                  } else {
                    m.status = 'PENDING';
                  }
                } else {
                  m.status = 'FUTURE';
                }
              }
            });
          });
        }
      }
    });
  }
  return data;
}"""

content = content.replace(old_function, new_function)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
