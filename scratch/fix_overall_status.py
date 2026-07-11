def fix_js_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    old_override = """    let overallStatus = rawName.toUpperCase().includes('DESOCUPAD') ? 'Desocupado' : 'Ocupado';
    if (paymentsHistory['2026'] && paymentsHistory['2026'][4] && paymentsHistory['2026'][4].status === 'VACANT') {
      overallStatus = 'Desocupado';
    }"""

    new_override = """    let overallStatus = rawName.toUpperCase().includes('DESOCUPAD') ? 'Desocupado' : 'Ocupado';
    const _todayStatus = new Date();
    const _currYearStatus = String(_todayStatus.getFullYear());
    const _currMonthStatus = _todayStatus.getMonth();
    if (paymentsHistory[_currYearStatus] && paymentsHistory[_currYearStatus][_currMonthStatus] && paymentsHistory[_currYearStatus][_currMonthStatus].status === 'VACANT') {
      overallStatus = 'Desocupado';
    }"""

    if old_override in content:
        content = content.replace(old_override, new_override)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {file_path}")
    else:
        print(f"Target block not found in {file_path}!")

fix_js_file("nuevo_admin_apps_script.js")
fix_js_file("crm_apps_script.js")
