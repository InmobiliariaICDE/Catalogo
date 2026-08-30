with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Helper function definition to add near top of JS or near functions
helper_js = """
function parseAdminStartDate(dStr) {
  if (!dStr || typeof dStr !== 'string') return null;
  const str = dStr.trim();
  if (!str) return null;
  if (str.match(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/)) {
    const parts = str.split(/[-\/]/);
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
  }
  if (str.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
    const parts = str.split(/[-\/]/);
    return { year: parseInt(parts[2], 10), month: parseInt(parts[1], 10), day: parseInt(parts[0], 10) };
  }
  return null;
}
"""

# Replace matrix table renovation month logic
old_renov_logic = """                  // Detectar si este mes es el mes de aniversario/renovación del contrato
                  let isRenovMonth = false;
                  if (p.start_date && p.start_date.includes("-")) {
                    const sMonthNum = parseInt(p.start_date.split("-")[1], 10);
                    const monthsArray = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                    if (monthsArray[sMonthNum - 1] === mFull) {
                      isRenovMonth = true;
                    }
                  }"""

new_renov_logic = """                  // Detectar si este mes es el mes de aniversario/renovación del contrato (soporta 6, 12 meses y cualquier formato de fecha)
                  let isRenovMonth = false;
                  const parsedSDate = parseAdminStartDate(p.start_date);
                  if (parsedSDate && parsedSDate.month >= 1 && parsedSDate.month <= 12) {
                    const monthsArray = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                    const startMonthIdx = parsedSDate.month - 1;
                    const dur = parseInt(p.duration, 10) || 12;
                    const targetMonthIdx = monthsArray.indexOf(mFull);
                    if (targetMonthIdx !== -1) {
                      let diff = (targetMonthIdx - startMonthIdx) % dur;
                      if (diff < 0) diff += dur;
                      if (diff === 0) isRenovMonth = true;
                    }
                  }"""

assert old_renov_logic in content, "old_renov_logic not found in admin.html"
content = content.replace(old_renov_logic, new_renov_logic)

# Insert helper_js if not already present
if 'function parseAdminStartDate' not in content:
    content = content.replace('<script>', '<script>\n' + helper_js, 1)

# Upgrade verificarRecordatoriosDeArriendo start_date parsing
old_remind_logic = """    // 2. Recordatorio de incremento de arriendo (aniversario del contrato)
    if (p.start_date) {
      const parts = p.start_date.split('-');
      if (parts.length === 3) {
        const startYear = parseInt(parts[0], 10);
        const startMonth = parseInt(parts[1], 10) - 1; // 0-indexed
        const startDay = parseInt(parts[2], 10);"""

new_remind_logic = """    // 2. Recordatorio de incremento de arriendo (aniversario del contrato)
    if (p.start_date) {
      const parsedSD = parseAdminStartDate(p.start_date);
      if (parsedSD) {
        const startYear = parsedSD.year;
        const startMonth = parsedSD.month - 1; // 0-indexed
        const startDay = parsedSD.day;"""

assert old_remind_logic in content, "old_remind_logic not found in admin.html"
content = content.replace(old_remind_logic, new_remind_logic)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Upgraded admin.html with robust contract renewal logic!")
