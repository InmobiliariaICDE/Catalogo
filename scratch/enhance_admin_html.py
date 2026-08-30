with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Update getStatusLabel case for NEW_CONTRACT
old_label = "case 'NEW_CONTRACT': return 'Nuevo Contrato';"
new_label = "case 'NEW_CONTRACT': return 'Renovación / Término de Contrato';"

assert old_label in content, "old_label not found in admin.html"
content = content.replace(old_label, new_label)

# 2. Enhance matrix cell tooltip and contract anniversary indicator
old_tooltip = "const tooltipText = `${p.name} - ${mFull}: ${getStatusLabel(pay.status)} ${pay.value && parseFloat(pay.value) > 0 ? safeFormatP(pay.value) : ''}`;"

new_tooltip = """// Detectar si este mes es el mes de aniversario/renovación del contrato
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

assert old_tooltip in content, "old_tooltip not found in admin.html"
content = content.replace(old_tooltip, new_tooltip)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Enhanced admin.html with contract renewal indicators and labels!")
