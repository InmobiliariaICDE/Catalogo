import os

# 1. Update crm_apps_script.js
crm_path = "crm_apps_script.js"
if os.path.exists(crm_path):
    with open(crm_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace getAdminData overallStatus logic
    old_status_logic = """    let overallStatus = rawName.toUpperCase().includes('DESOCUPAD') ? 'Desocupado' : 'Ocupado';
    const _todayStatus = new Date();
    const _currYearStatus = String(_todayStatus.getFullYear());
    const _currMonthStatus = _todayStatus.getMonth();
    if (paymentsHistory[_currYearStatus] && paymentsHistory[_currYearStatus][_currMonthStatus] && paymentsHistory[_currYearStatus][_currMonthStatus].status === 'VACANT') {
      overallStatus = 'Desocupado';
    }

    if (overallStatus === 'Desocupado') {
      Object.keys(paymentsHistory).forEach(year => {
        paymentsHistory[year].forEach(m => {
          if ((m.status === 'PENDING' || m.status === 'AL_DIA' || m.status === 'FUTURE') && (m.value === '-' || m.value === '')) {
            m.status = 'VACANT';
            m.value = 'DESOCUPADO';
          }
        });
      });
    }

    if (overallStatus === 'Ocupado') {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonthIdx = today.getMonth();
      Object.keys(paymentsHistory).forEach(year => {
        paymentsHistory[year].forEach((m, mIdx) => {
          const y = parseInt(year, 10);
          const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
          const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));
          
          if (m.status === 'VACANT' && (isCurrent || isFuture)) {
            if (isCurrent) {
              const todayDay = today.getDate();
              const limitDay = (dueDay && dueDay > 0) ? dueDay : 1;
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
    // Propagar desocupado después de una entrega
    let isVacantAfterDelivery = false;
    const sortedYears = Object.keys(paymentsHistory).map(Number).sort((a, b) => a - b);
    sortedYears.forEach(year => {
      paymentsHistory[year].forEach(m => {
        if (m.status === 'DELIVERY') {
          isVacantAfterDelivery = true;
        } else if (m.status === 'PAID' || m.status === 'NEW_CONTRACT') {
          isVacantAfterDelivery = false;
        } else if (isVacantAfterDelivery) {
          if (m.status === 'PENDING' || m.status === 'AL_DIA' || m.status === 'FUTURE' || m.status === 'UNSTARTED') {
            m.status = 'VACANT';
            m.value = 'DESOCUPADO';
          }
        }
      });
    });"""

    new_status_logic = """    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIdx = today.getMonth();

    // Chronological months sequence for propagation and healing
    const sortedYears = Object.keys(paymentsHistory).map(Number).sort((a, b) => a - b);
    const chronologicalMonths = [];
    sortedYears.forEach(year => {
      paymentsHistory[year].forEach((m, mIdx) => {
        chronologicalMonths.push({
          year,
          monthIdx: mIdx,
          cell: m
        });
      });
    });

    let isVacantWave = false;
    let overallStatus = 'Ocupado';
    if (rawName.toUpperCase().includes('DESOCUPAD')) {
      isVacantWave = true;
      overallStatus = 'Desocupado';
    }

    chronologicalMonths.forEach(item => {
      const m = item.cell;
      const valUpper = String(m.value).trim().toUpperCase();
      if (m.status === 'DELIVERY' || m.status === 'VACANT' || valUpper.includes('DESOCUPAD')) {
        isVacantWave = true;
      } else if (m.status === 'PAID' || m.status === 'NEW_CONTRACT') {
        isVacantWave = false;
      }

      if (isVacantWave) {
        if (m.status === 'PENDING' || m.status === 'AL_DIA' || m.status === 'FUTURE' || m.status === 'UNSTARTED') {
          m.status = 'VACANT';
          m.value = 'DESOCUPADO';
        }
      } else {
        // Heal empty cells of occupied properties
        if (m.status === 'UNSTARTED' || m.status === 'FUTURE' || m.status === 'PENDING' || m.status === 'AL_DIA') {
          const y = item.year;
          const mIdx = item.monthIdx;
          const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
          const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));

          if (isCurrent) {
            const todayDay = today.getDate();
            const limitDay = (dueDay && dueDay > 0) ? dueDay : 1;
            if (todayDay < limitDay) {
              m.status = 'AL_DIA';
            } else {
              m.status = 'PENDING';
            }
          } else if (isFuture) {
            m.status = 'FUTURE';
          }
        }
      }
      
      // Determine overallStatus based on current month status after propagation
      if (item.year === currentYear && item.monthIdx === currentMonthIdx) {
        overallStatus = (m.status === 'VACANT') ? 'Desocupado' : 'Ocupado';
      }
    });"""

    content = content.replace(old_status_logic, new_status_logic)

    # Replace saveAdminPaymentToSheet content
    old_save_payment = """  sheet.getRange(rowIdx, colIdx).setValue(params.value);
  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });"""

    new_save_payment = """  sheet.getRange(rowIdx, colIdx).setValue(params.value);

  // PROPAGATION & CLEARING LOGIC FOR VACANCY STATUS
  try {
    const monthsNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const yearsList = [2023, 2024, 2025, 2026, 2027];
    const sortedPaymentCols = [];

    yearsList.forEach(y => {
      monthsNames.forEach((mName, mIdx) => {
        for (let c = 0; c < headers.length; c++) {
          const h = String(headers[c]).trim().toUpperCase();
          if (h.includes(mName) && h.includes(String(y))) {
            sortedPaymentCols.push({ colIdx: c + 1, year: y, monthIdx: mIdx });
            break;
          }
        }
      });
    });

    const targetIndex = sortedPaymentCols.findIndex(item => item.colIdx === colIdx);
    if (targetIndex !== -1) {
      const valStr = String(params.value).trim().toUpperCase();
      const numVal = parseFloat(params.value);
      const isPaidOrNew = (!isNaN(numVal) && numVal > 0) || valStr.includes('NUEVO') || valStr.includes('CONTRATO') || valStr === 'PAGADO' || valStr === 'AL DIA' || valStr === 'AL_DIA';
      const isVacant = valStr.includes('DESOCUPAD') || valStr.includes('ENTREGA');

      if (isVacant) {
        // Propagate DESOCUPADO to subsequent cells until we hit a payment or active status
        for (let k = targetIndex + 1; k < sortedPaymentCols.length; k++) {
          const nextCol = sortedPaymentCols[k].colIdx;
          const nextValRaw = sheet.getRange(rowIdx, nextCol).getValue();
          const nextValStr = String(nextValRaw).trim().toUpperCase();
          const nextNum = parseFloat(nextValRaw);
          
          const isNextPaidOrActive = (!isNaN(nextNum) && nextNum > 0) || nextValStr.includes('NUEVO') || nextValStr.includes('CONTRATO') || nextValStr.includes('PREAVISO') || nextValStr.includes('RENOVA');
          
          if (!isNextPaidOrActive) {
            sheet.getRange(rowIdx, nextCol).setValue('DESOCUPADO');
          } else {
            break;
          }
        }
      } else if (isPaidOrNew) {
        // Clear stale DESOCUPADO from subsequent cells until we hit a payment or active status
        for (let k = targetIndex + 1; k < sortedPaymentCols.length; k++) {
          const nextCol = sortedPaymentCols[k].colIdx;
          const nextValRaw = sheet.getRange(rowIdx, nextCol).getValue();
          const nextValStr = String(nextValRaw).trim().toUpperCase();
          
          if (nextValStr.includes('DESOCUPAD') || nextValStr === '' || nextValStr === '-') {
            sheet.getRange(rowIdx, nextCol).setValue('-');
          } else {
            break;
          }
        }
      }
    }
  } catch (err) {
    Logger.log("Error in propagation: " + err.toString());
  }

  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });"""

    content = content.replace(old_save_payment, new_save_payment)

    with open(crm_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated crm_apps_script.js")

# 2. Update nuevo_admin_apps_script.js
nuevo_path = "nuevo_admin_apps_script.js"
if os.path.exists(nuevo_path):
    with open(nuevo_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace(old_status_logic, new_status_logic)

    # For saveAdminPaymentToSheet, we also need to fetch headers in nuevo_admin_apps_script.js since it was static before
    old_save_payment_nuevo = """  sheet.getRange(rowIdx, colIdx).setValue(params.value);
  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });"""

    new_save_payment_nuevo = """  sheet.getRange(rowIdx, colIdx).setValue(params.value);

  // PROPAGATION & CLEARING LOGIC FOR VACANCY STATUS
  try {
    const monthsNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const yearsList = [2023, 2024, 2025, 2026, 2027];
    const sortedPaymentCols = [];
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(5, 1, 1, lastCol).getValues()[0];

    yearsList.forEach(y => {
      monthsNames.forEach((mName, mIdx) => {
        for (let c = 0; c < headers.length; c++) {
          const h = String(headers[c]).trim().toUpperCase();
          if (h.includes(mName) && h.includes(String(y))) {
            sortedPaymentCols.push({ colIdx: c + 1, year: y, monthIdx: mIdx });
            break;
          }
        }
      });
    });

    const targetIndex = sortedPaymentCols.findIndex(item => item.colIdx === colIdx);
    if (targetIndex !== -1) {
      const valStr = String(params.value).trim().toUpperCase();
      const numVal = parseFloat(params.value);
      const isPaidOrNew = (!isNaN(numVal) && numVal > 0) || valStr.includes('NUEVO') || valStr.includes('CONTRATO') || valStr === 'PAGADO' || valStr === 'AL DIA' || valStr === 'AL_DIA';
      const isVacant = valStr.includes('DESOCUPAD') || valStr.includes('ENTREGA');

      if (isVacant) {
        // Propagate DESOCUPADO to subsequent cells until we hit a payment or active status
        for (let k = targetIndex + 1; k < sortedPaymentCols.length; k++) {
          const nextCol = sortedPaymentCols[k].colIdx;
          const nextValRaw = sheet.getRange(rowIdx, nextCol).getValue();
          const nextValStr = String(nextValRaw).trim().toUpperCase();
          const nextNum = parseFloat(nextValRaw);
          
          const isNextPaidOrActive = (!isNaN(nextNum) && nextNum > 0) || nextValStr.includes('NUEVO') || nextValStr.includes('CONTRATO') || nextValStr.includes('PREAVISO') || nextValStr.includes('RENOVA');
          
          if (!isNextPaidOrActive) {
            sheet.getRange(rowIdx, nextCol).setValue('DESOCUPADO');
          } else {
            break;
          }
        }
      } else if (isPaidOrNew) {
        // Clear stale DESOCUPADO from subsequent cells until we hit a payment or active status
        for (let k = targetIndex + 1; k < sortedPaymentCols.length; k++) {
          const nextCol = sortedPaymentCols[k].colIdx;
          const nextValRaw = sheet.getRange(rowIdx, nextCol).getValue();
          const nextValStr = String(nextValRaw).trim().toUpperCase();
          
          if (nextValStr.includes('DESOCUPAD') || nextValStr === '' || nextValStr === '-') {
            sheet.getRange(rowIdx, nextCol).setValue('-');
          } else {
            break;
          }
        }
      }
    }
  } catch (err) {
    Logger.log("Error in propagation: " + err.toString());
  }

  return createJsonResponse({ success: true, row: rowIdx, column: colIdx });"""

    content = content.replace(old_save_payment_nuevo, new_save_payment_nuevo)

    with open(nuevo_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated nuevo_admin_apps_script.js")

# 3. Update actualizar_admin.py
py_path = "actualizar_admin.py"
if os.path.exists(py_path):
    with open(py_path, "r", encoding="utf-8") as f:
        content = f.read()

    old_py_logic = """        # Overall status is usually Occupied, unless latest current month status is VACANT
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper():
            overall_status = "Desocupado"
        else:
            # Check current month payment status
            from datetime import datetime
            _today = datetime.now()
            _curr_year_str = str(_today.year)
            _curr_month_idx = _today.month - 1
            if _curr_year_str in payments_history and len(payments_history[_curr_year_str]) > _curr_month_idx:
                _curr_pay = payments_history[_curr_year_str][_curr_month_idx]
                if _curr_pay["status"] == "VACANT":
                    overall_status = "Desocupado"

        if overall_status == "Desocupado":
            for year_str in payments_history:
                for m in payments_history[year_str]:
                    if m["status"] in ("PENDING", "AL_DIA", "FUTURE") and m["value"] in ("-", ""):
                        m["status"] = "VACANT"
                        m["value"] = "DESOCUPADO"
                        
        if overall_status == "Ocupado":
            today = datetime.now()
            current_year = today.year
            current_month_idx = today.month - 1
            for year_str in payments_history:
                for m_idx, m in enumerate(payments_history[year_str]):
                    y = int(year_str)
                    is_current = (y == current_year and m_idx == current_month_idx)
                    is_future = (y > current_year or (y == current_year and m_idx > current_month_idx))
                    
                    if m["status"] == "VACANT" and (is_current or is_future):
                        if is_current:
                            today_day = today.day
                            limit_day = due_day if (due_day and due_day > 0) else 1
                            if today_day < limit_day:
                                m["status"] = "AL_DIA"
                            else:
                                m["status"] = "PENDING"
                        else:
                            m["status"] = "FUTURE"
        # Propagar desocupado después de una entrega
        is_vacant_after_delivery = False
        sorted_years = sorted(payments_history.keys(), key=int)
        for year_str in sorted_years:
            for m in payments_history[year_str]:
                if m["status"] == "DELIVERY":
                    is_vacant_after_delivery = True
                elif m["status"] in ("PAID", "NEW_CONTRACT"):
                    is_vacant_after_delivery = False
                elif is_vacant_after_delivery:
                    if m["status"] in ("PENDING", "AL_DIA", "FUTURE", "UNSTARTED"):
                        m["status"] = "VACANT"
                        m["value"] = "DESOCUPADO"."""

    # Note: we need to handle the dot at the end of the search query in Python if any, let's look at lines 209-222
    # The printed code had:
    # 219:                     if m["status"] in ("PENDING", "AL_DIA", "FUTURE", "UNSTARTED"):
    # 220:                         m["status"] = "VACANT"
    # 221:                         m["value"] = "DESOCUPADO"
    # 222: 
    # Let's write a targeted replacement for lines 167 to 222.
    
    old_py_logic_exact = """        # Overall status is usually Occupied, unless latest current month status is VACANT
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper():
            overall_status = "Desocupado"
        else:
            # Check current month payment status
            from datetime import datetime
            _today = datetime.now()
            _curr_year_str = str(_today.year)
            _curr_month_idx = _today.month - 1
            if _curr_year_str in payments_history and len(payments_history[_curr_year_str]) > _curr_month_idx:
                _curr_pay = payments_history[_curr_year_str][_curr_month_idx]
                if _curr_pay["status"] == "VACANT":
                    overall_status = "Desocupado"

        if overall_status == "Desocupado":
            for year_str in payments_history:
                for m in payments_history[year_str]:
                    if m["status"] in ("PENDING", "AL_DIA", "FUTURE") and m["value"] in ("-", ""):
                        m["status"] = "VACANT"
                        m["value"] = "DESOCUPADO"
                        
        if overall_status == "Ocupado":
            today = datetime.now()
            current_year = today.year
            current_month_idx = today.month - 1
            for year_str in payments_history:
                for m_idx, m in enumerate(payments_history[year_str]):
                    y = int(year_str)
                    is_current = (y == current_year and m_idx == current_month_idx)
                    is_future = (y > current_year or (y == current_year and m_idx > current_month_idx))
                    
                    if m["status"] == "VACANT" and (is_current or is_future):
                        if is_current:
                            today_day = today.day
                            limit_day = due_day if (due_day and due_day > 0) else 1
                            if today_day < limit_day:
                                m["status"] = "AL_DIA"
                            else:
                                m["status"] = "PENDING"
                        else:
                            m["status"] = "FUTURE"
        # Propagar desocupado después de una entrega
        is_vacant_after_delivery = False
        sorted_years = sorted(payments_history.keys(), key=int)
        for year_str in sorted_years:
            for m in payments_history[year_str]:
                if m["status"] == "DELIVERY":
                    is_vacant_after_delivery = True
                elif m["status"] in ("PAID", "NEW_CONTRACT"):
                    is_vacant_after_delivery = False
                elif is_vacant_after_delivery:
                    if m["status"] in ("PENDING", "AL_DIA", "FUTURE", "UNSTARTED"):
                        m["status"] = "VACANT"
                        m["value"] = "DESOCUPADO\""""

    new_py_logic = """        # Chronological months sequence for propagation and healing
        from datetime import datetime
        _today = datetime.now()
        _curr_year = _today.year
        _curr_month_idx = _today.month - 1

        months_order = []
        for year_str in sorted(payments_history.keys(), key=int):
            for m_idx, m in enumerate(payments_history[year_str]):
                months_order.append({
                    "year": int(year_str),
                    "month_idx": m_idx,
                    "cell": m
                })

        is_vacant_wave = False
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper():
            is_vacant_wave = True
            overall_status = "Desocupado"

        for item in months_order:
            m = item["cell"]
            val_upper = str(m["value"]).strip().upper()
            if m["status"] in ("DELIVERY", "VACANT") or "DESOCUPAD" in val_upper:
                is_vacant_wave = True
            elif m["status"] in ("PAID", "NEW_CONTRACT"):
                is_vacant_wave = False

            if is_vacant_wave:
                if m["status"] in ("PENDING", "AL_DIA", "FUTURE", "UNSTARTED"):
                    m["status"] = "VACANT"
                    m["value"] = "DESOCUPADO"
            else:
                # Heal empty cells of occupied properties
                if m["status"] in ("UNSTARTED", "FUTURE", "PENDING", "AL_DIA"):
                    y = item["year"]
                    m_idx = item["month_idx"]
                    is_current = (y == _curr_year and m_idx == _curr_month_idx)
                    is_future = (y > _curr_year or (y == _curr_year and m_idx > _curr_month_idx))

                    if is_current:
                        today_day = _today.day
                        limit_day = due_day if (due_day and due_day > 0) else 1
                        if today_day < limit_day:
                            m["status"] = "AL_DIA"
                        else:
                            m["status"] = "PENDING"
                    elif is_future:
                        m["status"] = "FUTURE"
            
            # Determine overall_status based on current month status after propagation
            if item["year"] == _curr_year and item["month_idx"] == _curr_month_idx:
                overall_status = "Desocupado" if m["status"] == "VACANT" else "Ocupado\""""

    content = content.replace(old_py_logic_exact, new_py_logic)

    with open(py_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated actualizar_admin.py")

# 4. Update admin.html
html_path = "admin.html"
if os.path.exists(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    old_html_logic = """      // Self-healing rules for overall status and future months
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
      }"""

    new_html_logic = """      // Self-healing rules for overall status and future months
      if (p.payments) {
        // Chronological months sequence
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

        let isVacantWave = false;
        let dynamicOverallStatus = 'Ocupado';
        if (p.name && String(p.name).toUpperCase().includes('DESOCUPAD')) {
          isVacantWave = true;
          dynamicOverallStatus = 'Desocupado';
        }

        chronologicalMonths.forEach(item => {
          const m = item.cell;
          const valUpper = String(m.value).trim().toUpperCase();
          if (m.status === 'DELIVERY' || m.status === 'VACANT' || valUpper.includes('DESOCUPAD')) {
            isVacantWave = true;
          } else if (m.status === 'PAID' || m.status === 'NEW_CONTRACT') {
            isVacantWave = false;
          }

          if (isVacantWave) {
            if (m.status === 'PENDING' || m.status === 'AL_DIA' || m.status === 'FUTURE' || m.status === 'UNSTARTED') {
              m.status = 'VACANT';
              m.value = 'DESOCUPADO';
            }
          } else {
            // Heal empty cells of occupied properties
            if (m.status === 'UNSTARTED' || m.status === 'FUTURE' || m.status === 'PENDING' || m.status === 'AL_DIA') {
              const y = item.year;
              const mIdx = item.monthIdx;
              const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
              const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));

              if (isCurrent) {
                const todayDay = today.getDate();
                const limitDay = (p.due_day && p.due_day > 0) ? p.due_day : 1;
                if (todayDay < limitDay) {
                  m.status = 'AL_DIA';
                } else {
                  m.status = 'PENDING';
                }
              } else if (isFuture) {
                m.status = 'FUTURE';
              }
            }
          }

          // Determine overallStatus based on current month status after propagation
          if (item.year === currentYear && item.monthIdx === currentMonthIdx) {
            dynamicOverallStatus = (m.status === 'VACANT') ? 'Desocupado' : 'Ocupado';
          }
        });
        p.status = dynamicOverallStatus;
      }"""

    content = content.replace(old_html_logic, new_html_logic)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated admin.html")
