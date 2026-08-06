import os

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace ensureUniqueIds logic in admin.html
start_tag = "function ensureUniqueIds(data) {"
end_tag = "return data;\n}"

start_pos = content.find(start_tag)
end_pos = content.find(end_tag, start_pos)

if start_pos != -1 and end_pos != -1:
    new_ensure_fn = """function ensureUniqueIds(data) {
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

        const paidIndices = [];
        const deliveryIndices = [];

        chronologicalMonths.forEach((item, idx) => {
          const m = item.cell;
          const valUpper = String(m.value).trim().toUpperCase();
          const numVal = parseFloat(m.value);
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
        const defaultVacant = (p.name && String(p.name).toUpperCase().includes('DESOCUPAD')) || (!hasAnyPayment && !hasTenant && !startDt);

        let dynamicOverallStatus = defaultVacant ? 'Desocupado' : 'Ocupado';

        chronologicalMonths.forEach((item, idx) => {
          const m = item.cell;
          const valUpper = String(m.value).trim().toUpperCase();
          const numVal = parseFloat(m.value);
          const isPaidCell = (!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO');
          const isDeliveryCell = m.status === 'DELIVERY' || valUpper.includes('ENTREGA');
          const isVacantCell = (m.status === 'VACANT' || valUpper.includes('DESOCUPAD')) && !isPaidCell;

          const lastDelivery = deliveryIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);
          const lastPaid = paidIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);

          let isCoveredByContract = false;
          if (startDt) {
            const mDate = new Date(item.year, item.monthIdx, 1);
            const endDate = new Date(startDt.getFullYear(), startDt.getMonth() + durationMonths, 1);
            if (mDate >= startDt && mDate < endDate) {
              isCoveredByContract = true;
            }
          }

          const isAfterPayment = (maxPaidIdx !== -1 && idx >= maxPaidIdx);

          if (isPaidCell) {
            // Keep PAID
          } else if (isDeliveryCell) {
            m.status = 'DELIVERY';
          } else if (lastDelivery > lastPaid) {
            m.status = 'VACANT';
            m.value = 'DESOCUPADO';
          } else if (isCoveredByContract || isAfterPayment) {
            const y = item.year;
            const mIdx = item.monthIdx;
            const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
            const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));

            if (isCurrent) {
              const todayDay = today.getDate();
              const limitDay = (p.due_day && p.due_day > 0) ? p.due_day : 5;
              if (todayDay < limitDay) {
                m.status = 'AL_DIA';
              } else {
                m.status = 'PENDING';
              }
              m.value = '-';
            } else if (isFuture) {
              m.status = 'FUTURE';
              m.value = '-';
            } else {
              m.status = 'PENDING';
              m.value = '-';
            }
          } else if (idx < maxPaidIdx) {
            if (isVacantCell || defaultVacant) {
              m.status = 'VACANT';
              m.value = 'DESOCUPADO';
            } else {
              m.status = 'PENDING';
              m.value = '-';
            }
          } else {
            if (defaultVacant) {
              m.status = 'VACANT';
              m.value = 'DESOCUPADO';
            } else {
              const y = item.year;
              const mIdx = item.monthIdx;
              const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
              const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));

              if (isCurrent) {
                const todayDay = today.getDate();
                const limitDay = (p.due_day && p.due_day > 0) ? p.due_day : 5;
                if (todayDay < limitDay) {
                  m.status = 'AL_DIA';
                } else {
                  m.status = 'PENDING';
                }
                m.value = '-';
              } else if (isFuture) {
                m.status = 'FUTURE';
                m.value = '-';
              } else {
                m.status = 'PENDING';
                m.value = '-';
              }
            }
          }

          if (item.year === currentYear && item.monthIdx === currentMonthIdx) {
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
    print("Replaced ensureUniqueIds in admin.html!")

# Add ensureUniqueIds call in save functions in admin.html
content = content.replace("applyPropToMemory();\n  applyPayToMemory();\n  localStorage.setItem('icde_admin_data', JSON.stringify(adminData));",
                          "applyPropToMemory();\n  applyPayToMemory();\n  ensureUniqueIds(adminData);\n  localStorage.setItem('icde_admin_data', JSON.stringify(adminData));")

content = content.replace("mPay.status = status; mPay.value = finalValue; }\n          else p.payments[year].push({ month: monthName, value: finalValue, status: status });\n          localStorage.setItem('icde_admin_data', JSON.stringify(adminData));",
                          "mPay.status = status; mPay.value = finalValue; }\n          else p.payments[year].push({ month: monthName, value: finalValue, status: status });\n          ensureUniqueIds(adminData);\n          localStorage.setItem('icde_admin_data', JSON.stringify(adminData));")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)


# 2. Update actualizar_admin.py
py_path = "actualizar_admin.py"
with open(py_path, "r", encoding="utf-8") as f:
    py_content = f.read()

py_start = "paid_indices = []"
py_end = "overall_status = \"Desocupado\" if m[\"status\"] == \"VACANT\" else \"Ocupado\""

p_start_pos = py_content.find(py_start)
p_end_pos = py_content.find(py_end, p_start_pos)

if p_start_pos != -1 and p_end_pos != -1:
    new_py_logic = """paid_indices = []
        delivery_indices = []
        for idx, item in enumerate(months_order):
            m = item["cell"]
            val_upper = str(m["value"]).strip().upper()
            try:
                num_val = float(m["value"])
            except (ValueError, TypeError):
                num_val = 0
            if num_val > 0 or m["status"] in ("PAID", "NEW_CONTRACT") or "CONTRATO" in val_upper or "NUEVO" in val_upper:
                paid_indices.append(idx)
            elif m["status"] == "DELIVERY" or "ENTREGA" in val_upper:
                delivery_indices.append(idx)

        has_any_payment = len(paid_indices) > 0
        max_paid_idx = max(paid_indices) if has_any_payment else -1

        start_dt = None
        if start_date_str:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d-%b-%y"):
                try:
                    start_dt = datetime.strptime(start_date_str.strip(), fmt).date()
                    break
                except Exception:
                    pass

        duration_m = duration if (duration and duration > 0) else 12
        has_tenant = bool(tenant_name and str(tenant_name).strip())
        default_vacant = ("DESOCUPAD" in raw_name.upper()) or (not has_any_payment and not has_tenant and not start_dt)
        overall_status = "Desocupado" if default_vacant else "Ocupado"

        for idx, item in enumerate(months_order):
            m = item["cell"]
            val_upper = str(m["value"]).strip().upper()
            try:
                num_val = float(m["value"])
            except (ValueError, TypeError):
                num_val = 0

            is_paid = (num_val > 0) or m["status"] in ("PAID", "NEW_CONTRACT") or "CONTRATO" in val_upper or "NUEVO" in val_upper
            is_delivery = m["status"] == "DELIVERY" or "ENTREGA" in val_upper
            is_vacant_cell = (m["status"] == "VACANT" or "DESOCUPAD" in val_upper) and not is_paid

            last_delivery = max([i for i in delivery_indices if i <= idx], default=-1)
            last_paid = max([i for i in paid_indices if i <= idx], default=-1)

            m_date = date(item["year"], item["month_idx"] + 1, 1)
            is_covered_by_contract = False
            if start_dt:
                c_start_m = date(start_dt.year, start_dt.month, 1)
                end_y = start_dt.year + (start_dt.month + duration_m - 1) // 12
                end_m = (start_dt.month + duration_m - 1) % 12 + 1
                c_end_m = date(end_y, end_m, 1)
                if c_start_m <= m_date < c_end_m:
                    is_covered_by_contract = True

            is_after_payment = (max_paid_idx != -1 and idx >= max_paid_idx)

            if is_paid:
                pass
            elif is_delivery:
                m["status"] = "DELIVERY"
            elif last_delivery > last_paid:
                m["status"] = "VACANT"
                m["value"] = "DESOCUPADO"
            elif is_covered_by_contract or is_after_payment:
                y = item["year"]
                m_idx = item["month_idx"]
                is_current = (y == _curr_year and m_idx == _curr_month_idx)
                is_future = (y > _curr_year or (y == _curr_year and m_idx > _curr_month_idx))

                if is_current:
                    today_day = _today.day
                    limit_day = due_day if (due_day and due_day > 0) else 5
                    if today_day < limit_day:
                        m["status"] = "AL_DIA"
                    else:
                        m["status"] = "PENDING"
                    m["value"] = "-"
                elif is_future:
                    m["status"] = "FUTURE"
                    m["value"] = "-"
                else:
                    m["status"] = "PENDING"
                    m["value"] = "-"
            elif idx < max_paid_idx:
                if is_vacant_cell or default_vacant:
                    m["status"] = "VACANT"
                    m["value"] = "DESOCUPADO"
                else:
                    m["status"] = "PENDING"
                    m["value"] = "-"
            else:
                if default_vacant:
                    m["status"] = "VACANT"
                    m["value"] = "DESOCUPADO"
                else:
                    y = item["year"]
                    m_idx = item["month_idx"]
                    is_current = (y == _curr_year and m_idx == _curr_month_idx)
                    is_future = (y > _curr_year or (y == _curr_year and m_idx > _curr_month_idx))

                    if is_current:
                        today_day = _today.day
                        limit_day = due_day if (due_day and due_day > 0) else 5
                        if today_day < limit_day:
                            m["status"] = "AL_DIA"
                        else:
                            m["status"] = "PENDING"
                        m["value"] = "-"
                    elif is_future:
                        m["status"] = "FUTURE"
                        m["value"] = "-"
                    else:
                        m["status"] = "PENDING"
                        m["value"] = "-"
            
            if item["year"] == _curr_year and item["month_idx"] == _curr_month_idx:
                overall_status = "Desocupado" if m["status"] == "VACANT" else "Ocupado\""""
    py_content = py_content[:p_start_pos] + new_py_logic + py_content[p_end_pos + len(py_end):]
    print("Replaced logic in actualizar_admin.py!")

with open(py_path, "w", encoding="utf-8") as f:
    f.write(py_content)

print("Done updating all files!")
