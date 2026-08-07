import os, re

admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update saveUnifiedAdminCobro in admin.html
old_cobro_fn = """async function saveUnifiedAdminCobro(propId, propName, monthName, year) {"""
start_cobro_pos = content.find(old_cobro_fn)
end_cobro_tag = "async function saveAdminPaymentStatus("
end_cobro_pos = content.find(end_cobro_tag, start_cobro_pos)

if start_cobro_pos != -1 and end_cobro_pos != -1:
    new_cobro_code = """async function saveUnifiedAdminCobro(propId, propName, monthName, year) {
  const saveBtn = document.getElementById('btnSaveUnifiedCobro');
  if (!saveBtn) return;

  const elTenantName = document.getElementById('editContraTenantName');
  const elTenantPhone = document.getElementById('editContraTenantPhone');
  const elRent = document.getElementById('editContraRent');
  const elDeposit = document.getElementById('editContraDeposit');
  const elStartDate = document.getElementById('editContraStartDate');
  const elDuration = document.getElementById('editContraDuration');
  const elDueDay = document.getElementById('editContraDueDay');
  const elMaxDueDay = document.getElementById('editContraMaxDueDay');
  const elIncreaseNotes = document.getElementById('editContraIncreaseNotes');
  const elDamageNotes = document.getElementById('editContraDamageNotes');

  const tenant_name = elTenantName ? elTenantName.value.trim() : '';
  const tenant_phone = elTenantPhone ? elTenantPhone.value.trim() : '';
  const monthly_rent = elRent ? (parseFloat(elRent.value) || 0) : 0;
  const deposit = elDeposit ? elDeposit.value.trim() : '';
  const start_date = elStartDate ? elStartDate.value : '';
  const duration = elDuration ? elDuration.value.trim() : '';
  const due_day = elDueDay ? (parseInt(elDueDay.value) || 5) : 5;
  const max_due_day = elMaxDueDay ? (parseInt(elMaxDueDay.value) || 10) : 10;
  const increase_notes = elIncreaseNotes ? elIncreaseNotes.value.trim() : '';
  const damage_notes = elDamageNotes ? elDamageNotes.value.trim() : '';

  const topSelect = document.getElementById('topPayStatusSelect');
  const bottomSelect = document.getElementById('editPayStatus');
  const statusSelect = topSelect || bottomSelect;
  const status = statusSelect ? statusSelect.value : 'PENDING';
  
  const valueInput = document.getElementById('editPayValue');
  let rawValue = valueInput ? valueInput.value.trim() : '';

  let finalValue = '';
  if (status === 'PAID') {
    const parsedVal = parseFloat(rawValue);
    if (isNaN(parsedVal) || parsedVal <= 0) {
      const p = adminData.properties.find(x => String(x.id) === String(propId) || String(x.name).trim() === String(propName).trim() || (x.excel_row && String(x.excel_row) === String(propId)));
      finalValue = monthly_rent || (p ? p.monthly_rent : 0);
    } else { finalValue = parsedVal; }
  } else if (status === 'VACANT') { finalValue = 'DESOCUPADO'; }
  else if (status === 'FUTURE' || status === 'AL_DIA') { finalValue = '-'; }
  else if (status === 'PREAVISO')      { finalValue = 'PREAVISO'; }
  else if (status === 'NEW_CONTRACT')  { finalValue = 'CONTRATO NUEVO'; }
  else if (status === 'NO_RENEW')      { finalValue = 'NO RENOVARA'; }
  else if (status === 'DELIVERY')      { finalValue = 'ENTREGA'; }
  else if (status === 'PENDING')       { finalValue = 'Pendiente'; }
  else { finalValue = rawValue || '-'; }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner" style="width:14px; height:14px; border-width:2px; display:inline-block; margin-right:6px; vertical-align:middle;"></span> Guardando...';

  const applyPropToMemory = () => {
    const p = adminData.properties.find(x => String(x.id) === String(propId) || String(x.name).trim() === String(propName).trim() || (x.excel_row && String(x.excel_row) === String(propId)));
    if (p) {
      Object.assign(p, {
        tenant_name, tenant_phone, monthly_rent,
        deposit, start_date, duration,
        due_day, max_due_day,
        increase_notes, damage_notes
      });
      ensureUniqueIds(adminData);
      localStorage.setItem('icde_admin_data', JSON.stringify(adminData));
    }
  };

  const applyPayToMemory = () => {
    const p = adminData.properties.find(x => String(x.id) === String(propId) || String(x.name).trim() === String(propName).trim() || (x.excel_row && String(x.excel_row) === String(propId)));
    if (p) {
      if (!p.payments[year]) p.payments[year] = [];
      let mPay = p.payments[year].find(m => m.month === monthName);
      if (mPay) { mPay.status = status; mPay.value = finalValue; }
      else p.payments[year].push({ month: monthName, value: finalValue, status: status });
      ensureUniqueIds(adminData);
      localStorage.setItem('icde_admin_data', JSON.stringify(adminData));
    }
  };

  applyPropToMemory();
  applyPayToMemory();

  const payloadProp = {
    action: 'saveAdminProperty',
    propertyId: propId,
    propertyNameOld: propName,
    name:           propName,
    tenant_name,
    tenant_phone,
    monthly_rent,
    deposit,
    start_date,
    duration,
    due_day,
    max_due_day,
    increase_notes,
    damage_notes
  };

  const monthsNames = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  const monthIdx = monthsNames.indexOf(monthName.toUpperCase());

  const payloadPay = {
    action: 'saveAdminPayment',
    propertyId: propId, propertyName: propName,
    year: year, monthIndex: monthIdx, value: finalValue
  };

  fetch(ADMIN_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payloadProp)
  }).catch(e => null);

  fetch(ADMIN_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payloadPay)
  }).catch(e => null);

  toast('¡Cambios guardados con éxito!', 'success');
  closeUnifiedModal();
  renderAdministracion();
}

"""
    content = content[:start_cobro_pos] + new_cobro_code + content[end_cobro_pos:]
    print("Replaced saveUnifiedAdminCobro in admin.html!")

# 2. Update quickSaveAdminPaymentStatus in admin.html
old_quick_fn = """async function quickSaveAdminPaymentStatus(propId, propName, monthName, year, status) {"""
start_quick_pos = content.find(old_quick_fn)
end_quick_tag = "async function saveAdminPropertyDetails("
end_quick_pos = content.find(end_quick_tag, start_quick_pos)

if start_quick_pos != -1 and end_quick_pos != -1:
    new_quick_code = """async function quickSaveAdminPaymentStatus(propId, propName, monthName, year, status) {
  const monthsNames = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  const monthIdx = monthsNames.indexOf(monthName.toUpperCase());

  let finalValue = '';
  if (status === 'PAID') {
    const p = adminData.properties.find(x => String(x.id) === String(propId) || String(x.name).trim() === String(propName).trim());
    finalValue = p ? p.monthly_rent : 0;
  } else if (status === 'VACANT') { finalValue = 'DESOCUPADO'; }
  else if (status === 'FUTURE' || status === 'AL_DIA') { finalValue = '-'; }
  else if (status === 'PREAVISO')      { finalValue = 'PREAVISO'; }
  else if (status === 'NEW_CONTRACT')  { finalValue = 'CONTRATO NUEVO'; }
  else if (status === 'NO_RENEW')      { finalValue = 'NO RENOVARA'; }
  else if (status === 'DELIVERY')      { finalValue = 'ENTREGA'; }
  else if (status === 'PENDING')       { finalValue = 'Pendiente'; }
  else { finalValue = '-'; }

  const p = adminData.properties.find(x => String(x.id) === String(propId) || String(x.name).trim() === String(propName).trim() || (x.excel_row && String(x.excel_row) === String(propId)));
  if (p) {
    if (!p.payments[year]) p.payments[year] = [];
    let mPay = p.payments[year].find(m => m.month === monthName);
    if (mPay) { mPay.status = status; mPay.value = finalValue; }
    else p.payments[year].push({ month: monthName, value: finalValue, status: status });
    ensureUniqueIds(adminData);
    localStorage.setItem('icde_admin_data', JSON.stringify(adminData));
  }
  renderAdministracion();

  const payload = {
    action: 'saveAdminPayment',
    propertyId: propId, propertyName: propName,
    year: year, monthIndex: monthIdx, value: finalValue
  };

  fetch(ADMIN_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  }).then(async response => {
    if (response.ok) {
      const resData = await response.json();
      if (resData.success) {
        toast('Pago actualizado en la nube con éxito!', 'success');
      }
    }
  }).catch(err => {
    console.warn('Sync en segundo plano:', err);
  });
}

"""
    content = content[:start_quick_pos] + new_quick_code + content[end_quick_pos:]
    print("Replaced quickSaveAdminPaymentStatus in admin.html!")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done applying instant save fix!")
