import os

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

old_html_block = """        let hasAnyPaymentOrActiveContract = false;
        chronologicalMonths.forEach(item => {
          const m = item.cell;
          const valUpper = String(m.value).trim().toUpperCase();
          const numVal = parseFloat(m.value);
          if ((!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO')) {
            hasAnyPaymentOrActiveContract = true;
          }
        });

        let isVacantWave = false;
        let dynamicOverallStatus = 'Ocupado';
        if ((p.name && String(p.name).toUpperCase().includes('DESOCUPAD')) || !p.tenant_name || String(p.tenant_name).trim() === '' || !hasAnyPaymentOrActiveContract) {
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
        });"""

new_html_block = """        const paidIndices = [];
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
        const defaultVacant = (p.name && String(p.name).toUpperCase().includes('DESOCUPAD')) || (!hasAnyPayment && (!p.tenant_name || String(p.tenant_name).trim() === ''));

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

          if (isPaidCell) {
            // Keep PAID
          } else if (isDeliveryCell) {
            m.status = 'DELIVERY';
          } else if (lastDelivery > lastPaid) {
            m.status = 'VACANT';
            m.value = 'DESOCUPADO';
          } else if (idx < maxPaidIdx) {
            if (isVacantCell || defaultVacant) {
              m.status = 'VACANT';
              m.value = 'DESOCUPADO';
            } else {
              m.status = 'PENDING';
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
              } else if (isFuture) {
                m.status = 'FUTURE';
              } else {
                m.status = 'PENDING';
              }
            }
          }

          if (item.year === currentYear && item.monthIdx === currentMonthIdx) {
            dynamicOverallStatus = (m.status === 'VACANT') ? 'Desocupado' : 'Ocupado';
          }
        });"""

if old_html_block in content:
    content = content.replace(old_html_block, new_html_block)
    print("Updated admin.html!")
else:
    print("WARNING: old_html_block not found in admin.html")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)


# 2. Update nuevo_admin_apps_script.js
nuevo_path = "nuevo_admin_apps_script.js"
with open(nuevo_path, "r", encoding="utf-8") as f:
    content = f.read()

old_nuevo_block = """    let hasAnyPaymentOrActiveContract = false;
    chronologicalMonths.forEach(item => {
      const m = item.cell;
      const valUpper = String(m.value).trim().toUpperCase();
      const numVal = parseFloat(m.value);
      if ((!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO')) {
        hasAnyPaymentOrActiveContract = true;
      }
    });

    let isVacantWave = false;
    let overallStatus = 'Ocupado';
    if (rawName.toUpperCase().includes('DESOCUPAD') || !tenantName || String(tenantName).trim() === '' || !hasAnyPaymentOrActiveContract) {
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

new_nuevo_block = """    const paidIndices = [];
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
    const defaultVacant = rawName.toUpperCase().includes('DESOCUPAD') || (!hasAnyPayment && (!tenantName || String(tenantName).trim() === ''));

    let overallStatus = defaultVacant ? 'Desocupado' : 'Ocupado';

    chronologicalMonths.forEach((item, idx) => {
      const m = item.cell;
      const valUpper = String(m.value).trim().toUpperCase();
      const numVal = parseFloat(m.value);
      const isPaidCell = (!isNaN(numVal) && numVal > 0) || m.status === 'PAID' || m.status === 'NEW_CONTRACT' || valUpper.includes('CONTRATO') || valUpper.includes('NUEVO');
      const isDeliveryCell = m.status === 'DELIVERY' || valUpper.includes('ENTREGA');
      const isVacantCell = (m.status === 'VACANT' || valUpper.includes('DESOCUPAD')) && !isPaidCell;

      const lastDelivery = deliveryIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);
      const lastPaid = paidIndices.filter(i => i <= idx).reduce((max, i) => Math.max(max, i), -1);

      if (isPaidCell) {
        // Keep PAID
      } else if (isDeliveryCell) {
        m.status = 'DELIVERY';
      } else if (lastDelivery > lastPaid) {
        m.status = 'VACANT';
        m.value = 'DESOCUPADO';
      } else if (idx < maxPaidIdx) {
        if (isVacantCell || defaultVacant) {
          m.status = 'VACANT';
          m.value = 'DESOCUPADO';
        } else {
          m.status = 'PENDING';
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
            const limitDay = (dueDay && dueDay > 0) ? dueDay : 5;
            if (todayDay < limitDay) {
              m.status = 'AL_DIA';
            } else {
              m.status = 'PENDING';
            }
          } else if (isFuture) {
            m.status = 'FUTURE';
          } else {
            m.status = 'PENDING';
          }
        }
      }

      if (item.year === currentYear && item.monthIdx === currentMonthIdx) {
        overallStatus = (m.status === 'VACANT') ? 'Desocupado' : 'Ocupado';
      }
    });"""

if old_nuevo_block in content:
    content = content.replace(old_nuevo_block, new_nuevo_block)
    print("Updated nuevo_admin_apps_script.js!")
else:
    print("WARNING: old_nuevo_block not found in nuevo_admin_apps_script.js")

with open(nuevo_path, "w", encoding="utf-8") as f:
    f.write(content)


# 3. Update crm_apps_script.js
crm_path = "crm_apps_script.js"
with open(crm_path, "r", encoding="utf-8") as f:
    content = f.read()

if old_nuevo_block in content:
    content = content.replace(old_nuevo_block, new_nuevo_block)
    print("Updated crm_apps_script.js!")
else:
    print("WARNING: old_nuevo_block not found in crm_apps_script.js")

with open(crm_path, "w", encoding="utf-8") as f:
    f.write(content)


# 4. Update actualizar_admin.py
py_path = "actualizar_admin.py"
with open(py_path, "r", encoding="utf-8") as f:
    content = f.read()

old_py_block = """        has_any_payment_or_contract = False
        for item in months_order:
            m = item["cell"]
            val_upper = str(m["value"]).strip().upper()
            try:
                num_val = float(m["value"])
            except (ValueError, TypeError):
                num_val = 0
            if num_val > 0 or m["status"] in ("PAID", "NEW_CONTRACT") or "CONTRATO" in val_upper or "NUEVO" in val_upper:
                has_any_payment_or_contract = True

        is_vacant_wave = False
        overall_status = "Ocupado"
        if "DESOCUPAD" in raw_name.upper() or not tenant_name or not str(tenant_name).strip() or not has_any_payment_or_contract:
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

new_py_block = """        paid_indices = []
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
        default_vacant = ("DESOCUPAD" in raw_name.upper()) or (not has_any_payment and (not tenant_name or not str(tenant_name).strip()))
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

            if is_paid:
                pass
            elif is_delivery:
                m["status"] = "DELIVERY"
            elif last_delivery > last_paid:
                m["status"] = "VACANT"
                m["value"] = "DESOCUPADO"
            elif idx < max_paid_idx:
                if is_vacant_cell or default_vacant:
                    m["status"] = "VACANT"
                    m["value"] = "DESOCUPADO"
                else:
                    m["status"] = "PENDING"
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
                    elif is_future:
                        m["status"] = "FUTURE"
                    else:
                        m["status"] = "PENDING"
            
            if item["year"] == _curr_year and item["month_idx"] == _curr_month_idx:
                overall_status = "Desocupado" if m["status"] == "VACANT" else "Ocupado\""""

if old_py_block in content:
    content = content.replace(old_py_block, new_py_block)
    print("Updated actualizar_admin.py!")
else:
    print("WARNING: old_py_block not found in actualizar_admin.py")

with open(py_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating files!")
