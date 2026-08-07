import os

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

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

        const isOccupiedProp = !isVacantByName && (hasTenant || Boolean(startDt));

        let dynamicOverallStatus = isOccupiedProp ? 'Ocupado' : 'Desocupado';

        let rolledEndDt = null;
        if (startDt && isOccupiedProp) {
          rolledEndDt = new Date(startDt.getFullYear(), startDt.getMonth() + durationMonths, 1);
          const lastDelivery = deliveryIndices.reduce((max, i) => Math.max(max, i), -1);
          const lastPaid = paidIndices.reduce((max, i) => Math.max(max, i), -1);
          const hasDelivered = (lastDelivery > lastPaid);

          if (!hasDelivered) {
            const targetDate = new Date(currentYear, currentMonthIdx, 1);
            while (rolledEndDt <= targetDate) {
              rolledEndDt = new Date(rolledEndDt.getFullYear(), rolledEndDt.getMonth() + durationMonths, 1);
            }
          }
        }

        chronologicalMonths.forEach((item, idx) => {
          const m = item.cell;
          const y = item.year;
          const mIdx = item.monthIdx;
          const valUpper = String(m.value).trim().toUpperCase();
          const numVal = parseFloat(String(m.value).replace(/[^0-9.]/g, ''));
          const isPaidCell = (!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO');
          const isDeliveryCell = m.status === 'DELIVERY' || valUpper.includes('ENTREGA');

          const lastDelivery = deliveryIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);
          const lastPaid = paidIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);

          const mDate = new Date(y, mIdx, 1);
          let isBeforeStart = false;
          let isAfterEnd = false;
          if (startDt) {
            const cStart = new Date(startDt.getFullYear(), startDt.getMonth(), 1);
            if (mDate < cStart) isBeforeStart = true;
          }
          if (rolledEndDt) {
            if (mDate >= rolledEndDt) isAfterEnd = true;
          }

          const isCurrent = (y === currentYear && mIdx === currentMonthIdx);
          const isFuture = (y > currentYear || (y === currentYear && mIdx > currentMonthIdx));

          if (isPaidCell) {
            // Keep PAID / NEW_CONTRACT
          } else if (isDeliveryCell) {
            m.status = 'DELIVERY';
          } else if (!isOccupiedProp || lastDelivery > lastPaid || isBeforeStart || isAfterEnd) {
            m.status = 'VACANT';
            m.value = 'DESOCUPADO';
          } else if (isFuture) {
            m.status = 'FUTURE';
            m.value = '-';
          } else if (isCurrent) {
            const todayDay = today.getDate();
            const limitDay = (p.due_day && p.due_day > 0) ? p.due_day : 5;
            if (todayDay < limitDay) {
              m.status = 'AL_DIA';
            } else {
              m.status = 'PENDING';
            }
            m.value = '-';
          } else {
            // Past month during active contract
            m.status = 'PENDING';
            m.value = '-';
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
            num_val = parse_number(m["value"])
            if num_val > 0 or m["status"] in ("PAID", "NEW_CONTRACT") or "CONTRATO" in val_upper or "NUEVO" in val_upper:
                paid_indices.append(idx)
            elif m["status"] == "DELIVERY" or "ENTREGA" in val_upper:
                delivery_indices.append(idx)

        has_any_payment = len(paid_indices) > 0
        max_paid_idx = max(paid_indices) if has_any_payment else -1

        start_dt = None
        if start_date:
            start_date_str = str(start_date)
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d-%b-%y"):
                try:
                    start_dt = datetime.strptime(start_date_str.strip(), fmt).date()
                    break
                except Exception:
                    pass

        try:
            duration_m = int(float(duration)) if (duration and str(duration).strip() != '') else 12
        except Exception:
            duration_m = 12

        has_tenant = bool(tenant_name and str(tenant_name).strip())
        is_vacant_by_name = "DESOCUPAD" in raw_name.upper()
        is_occupied_prop = not is_vacant_by_name and (has_tenant or bool(start_dt))

        rolled_end_dt = None
        if start_dt and is_occupied_prop:
            cur_end_y = start_dt.year + (start_dt.month + duration_m - 1) // 12
            cur_end_m = (start_dt.month + duration_m - 1) % 12 + 1
            rolled_end_dt = date(cur_end_y, cur_end_m, 1)

            last_delivery = max(delivery_indices, default=-1)
            last_paid = max(paid_indices, default=-1)
            has_delivered = (last_delivery > last_paid)

            if not has_delivered:
                target_date = date(_curr_year, _curr_month_idx + 1, 1)
                while rolled_end_dt <= target_date:
                    r_y = rolled_end_dt.year + (rolled_end_dt.month + duration_m - 1) // 12
                    r_m = (rolled_end_dt.month + duration_m - 1) % 12 + 1
                    rolled_end_dt = date(r_y, r_m, 1)

        overall_status = "Ocupado" if is_occupied_prop else "Desocupado"

        for idx, item in enumerate(months_order):
            m = item["cell"]
            y = item["year"]
            m_idx = item["month_idx"]
            val_upper = str(m["value"]).strip().upper()
            num_val = parse_number(m["value"])

            is_paid = (num_val > 0) or m["status"] in ("PAID", "NEW_CONTRACT") or "CONTRATO" in val_upper or "NUEVO" in val_upper
            is_delivery = m["status"] == "DELIVERY" or "ENTREGA" in val_upper

            last_delivery = max([i for i in delivery_indices if i <= idx], default=-1)
            last_paid = max([i for i in paid_indices if i <= idx], default=-1)

            m_date = date(y, m_idx + 1, 1)
            is_before_start = False
            is_after_end = False
            if start_dt:
                c_start_m = date(start_dt.year, start_dt.month, 1)
                if m_date < c_start_m:
                    is_before_start = True
            if rolled_end_dt:
                if m_date >= rolled_end_dt:
                    is_after_end = True

            is_current = (y == _curr_year and m_idx == _curr_month_idx)
            is_future = (y > _curr_year or (y == _curr_year and m_idx > _curr_month_idx))

            if is_paid:
                pass
            elif is_delivery:
                m["status"] = "DELIVERY"
            elif not is_occupied_prop or last_delivery > last_paid or is_before_start or is_after_end:
                m["status"] = "VACANT"
                m["value"] = "DESOCUPADO"
            elif is_future:
                m["status"] = "FUTURE"
                m["value"] = "-"
            elif is_current:
                today_day = _today.day
                limit_day = due_day if (due_day and due_day > 0) else 5
                if today_day < limit_day:
                    m["status"] = "AL_DIA"
                else:
                    m["status"] = "PENDING"
                m["value"] = "-"
            else:
                m["status"] = "PENDING"
                m["value"] = "-"
            
            if item["year"] == _curr_year and item["month_idx"] == _curr_month_idx:
                overall_status = "Desocupado" if m["status"] == "VACANT" else "Ocupado\""""
    py_content = py_content[:p_start_pos] + new_py_logic + py_content[p_end_pos + len(py_end):]
    print("Updated logic in actualizar_admin.py!")

with open(py_path, "w", encoding="utf-8") as f:
    f.write(py_content)

print("Done applying habitacion azul fix!")
