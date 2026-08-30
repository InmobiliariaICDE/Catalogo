import sys

with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

lines = content.splitlines()
start_idx = -1
end_idx = -1

for i, l in enumerate(lines):
    if 'Si AL_DIA pero hay pagos PENDIENTES' in l:
        start_idx = i - 1
    if 'const renovBadge = isRenovMonth' in l:
        end_idx = i
        break

print(f"Replacing lines {start_idx+1} to {end_idx+1}")

# Construct correct new lines
new_lines = [
    '                  // Detectar si este mes es el mes de aniversario/renovación del contrato',
    '                  let isRenovMonth = false;',
    '                  if (p.start_date && p.start_date.includes("-")) {',
    '                    const sMonthNum = parseInt(p.start_date.split("-")[1], 10);',
    '                    const monthsArray = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];',
    '                    if (monthsArray[sMonthNum - 1] === mFull) {',
    '                      isRenovMonth = true;',
    '                    }',
    '                  }',
    '',
    '                  // Si AL_DIA pero hay pagos PENDIENTES en meses PASADOS del año actual, mostrar como Futuro',
    '                  if (pay.status === "AL_DIA") {',
    '                    const _viewY = parseInt(currentAdminYear, 10);',
    '                    const _now = new Date();',
    '                    const _nowY = _now.getFullYear();',
    '                    const _nowM = _now.getMonth(); // 0-based',
    '                    const hasPastPending = (p.payments[_viewY] || []).some((m, mIdx) => {',
    '                      const isPast = _viewY < _nowY || (_viewY === _nowY && mIdx < _nowM);',
    '                      return isPast && m.status === "PENDING";',
    '                    });',
    '                    if (hasPastPending) pay = { ...pay, status: "FUTURE" };',
    '                  }',
    '',
    '                  // Si es el mes de renovación y no está pagado o desocupado, marcar como NEW_CONTRACT para mostrar la estrella de renovación',
    '                  if (isRenovMonth && (pay.status === "PENDING" || pay.status === "FUTURE" || pay.status === "UNSTARTED")) {',
    '                    pay = { ...pay, status: "NEW_CONTRACT" };',
    '                  }',
    '',
    '                  let cellContent = "·";',
    '                  if (pay.status === "PAID") cellContent = "✓";',
    '                  else if (pay.status === "PENDING") cellContent = "$";',
    '                  else if (pay.status === "PREAVISO") cellContent = "⚠";',
    '                  else if (pay.status === "NEW_CONTRACT") cellContent = "★";',
    '                  else if (pay.status === "VACANT") cellContent = "-";',
    '                  else if (pay.status === "NO_RENEW") cellContent = "⌛";',
    '                  else if (pay.status === "DELIVERY") cellContent = "⛳";',
    '                  else if (pay.status === "AL_DIA") cellContent = "☀";'
]

lines[start_idx:end_idx] = new_lines

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print("SUCCESSFULLY REPLACED AND REORDERED LINES IN admin.html!")
