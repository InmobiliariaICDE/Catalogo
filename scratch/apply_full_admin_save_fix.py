import os, re

# 1. Update admin.html
admin_path = "admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add mergeLocalAdminData helper to admin.html before loadAdminData
merge_fn_code = """function mergeLocalAdminData(freshData) {
  const cachedStr = localStorage.getItem('icde_admin_data');
  if (!cachedStr) return freshData;
  try {
    const cachedData = JSON.parse(cachedStr);
    if (!cachedData || !cachedData.properties) return freshData;

    freshData.properties.forEach(freshProp => {
      const cachedProp = cachedData.properties.find(c => String(c.id) === String(freshProp.id) || (c.excel_row && String(c.excel_row) === String(freshProp.excel_row)));
      if (cachedProp) {
        ['tenant_name', 'tenant_phone', 'start_date', 'duration', 'deposit', 'increase_notes', 'damage_notes'].forEach(key => {
          if (cachedProp[key] && !freshProp[key]) {
            freshProp[key] = cachedProp[key];
          }
        });
        if (cachedProp.payments && freshProp.payments) {
          Object.keys(cachedProp.payments).forEach(year => {
            if (!freshProp.payments[year]) freshProp.payments[year] = cachedProp.payments[year];
            else {
              cachedProp.payments[year].forEach(cPay => {
                const fPay = freshProp.payments[year].find(f => f.month === cPay.month);
                if (fPay) {
                  if (cPay.status && cPay.status !== 'UNSTARTED' && cPay.status !== 'PENDING' && fPay.status === 'PENDING') {
                    fPay.status = cPay.status;
                    fPay.value = cPay.value;
                  }
                } else {
                  freshProp.payments[year].push(cPay);
                }
              });
            }
          });
        }
      }
    });

    cachedData.properties.forEach(cachedProp => {
      const existsInFresh = freshData.properties.some(f => String(f.id) === String(cachedProp.id) || (f.excel_row && String(f.excel_row) === String(cachedProp.excel_row)));
      if (!existsInFresh) {
        freshData.properties.push(cachedProp);
      }
    });
  } catch(e) {
    console.warn("Error en mergeLocalAdminData:", e);
  }
  return freshData;
}
"""

if "function mergeLocalAdminData" not in content:
    content = content.replace("async function loadAdminData() {", merge_fn_code + "\nasync function loadAdminData() {")

# Update loadAdminData to use mergeLocalAdminData
content = content.replace("adminData = ensureUniqueIds(data);", "adminData = ensureUniqueIds(mergeLocalAdminData(data));")

# Update saveUnifiedAdminCobro in admin.html
old_save_cobro = """async function saveUnifiedAdminCobro(propId, propName, monthName, year) {"""
start_cobro_pos = content.find(old_save_cobro)
end_cobro_tag = "async function saveAdminPaymentStatus("
end_cobro_pos = content.find(end_cobro_tag, start_cobro_pos)

if start_cobro_pos != -1 and end_cobro_pos != -1:
    new_cobro_fn = """async function saveUnifiedAdminCobro(propId, propName, monthName, year) {
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

  const statusSelect = document.getElementById('editPayStatus');
  const valueInput   = document.getElementById('editPayValue');
  const status = statusSelect ? statusSelect.value : 'PENDING';
  let rawValue = valueInput ? valueInput.value.trim() : '';

  let finalValue = '';
  if (status === 'PAID') {
    const parsedVal = parseFloat(rawValue);
    if (isNaN(parsedVal) || parsedVal <= 0) {
      const p = adminData.properties.find(x => String(x.id) === String(propId));
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
    const p = adminData.properties.find(x => String(x.id) === String(propId));
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
    const p = adminData.properties.find(x => String(x.id) === String(propId));
    if (p) {
      if (!p.payments[year]) p.payments[year] = [];
      let mPay = p.payments[year].find(m => m.month === monthName);
      if (mPay) { mPay.status = status; mPay.value = finalValue; }
      else p.payments[year].push({ month: monthName, value: finalValue, status: status });
      ensureUniqueIds(adminData);
      localStorage.setItem('icde_admin_data', JSON.stringify(adminData));
    }
  };

  // Immediate local memory update
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

  const promises = [
    fetch(ADMIN_SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payloadProp)
    }).catch(e => null),
    fetch(ADMIN_SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payloadPay)
    }).catch(e => null)
  ];

  toast('¡Cambios guardados con éxito!', 'success');
  closeUnifiedModal();
  renderAdministracion();
}

"""
    content = content[:start_cobro_pos] + new_cobro_fn + content[end_cobro_pos:]
    print("Updated saveUnifiedAdminCobro in admin.html!")

# Update saveAdminPropertyDetails in admin.html
old_save_prop = """async function saveAdminPropertyDetails(propId, propNameOld) {"""
start_prop_pos = content.find(old_save_prop)
end_prop_tag = "async function deleteAdminProperty("
end_prop_pos = content.find(end_prop_tag, start_prop_pos)

if start_prop_pos != -1 and end_prop_pos != -1:
    new_prop_fn = """async function saveAdminPropertyDetails(propId, propNameOld) {
  const saveBtn = document.getElementById('btnSaveAdminProperty');
  if (!saveBtn) return;

  const elPropName = document.getElementById('editPropName');
  const elPropOwner = document.getElementById('editPropOwner');
  const elPropOwnerPhone = document.getElementById('editPropOwnerPhone');
  const elPropRent = document.getElementById('editPropRent');
  const elPropDeposit = document.getElementById('editPropDeposit');
  const elPropStartDate = document.getElementById('editPropStartDate');
  const elPropDuration = document.getElementById('editPropDuration');
  const elPropDueDay = document.getElementById('editPropDueDay');
  const elPropMaxDueDay = document.getElementById('editPropMaxDueDay');
  const elPropIncreaseNotes = document.getElementById('editPropIncreaseNotes');
  const elPropDamageNotes = document.getElementById('editPropDamageNotes');

  const payload = {
    action: 'saveAdminProperty',
    propertyId: propId,
    propertyNameOld: propNameOld,
    name:           elPropName ? elPropName.value.trim() : propNameOld,
    owner:          elPropOwner ? elPropOwner.value.trim() : '',
    owner_phone:    elPropOwnerPhone ? elPropOwnerPhone.value.trim() : '',
    monthly_rent:   elPropRent ? (parseFloat(elPropRent.value) || 0) : 0,
    deposit:        elPropDeposit ? elPropDeposit.value.trim() : '',
    start_date:     elPropStartDate ? elPropStartDate.value : '',
    duration:       elPropDuration ? elPropDuration.value.trim() : '',
    due_day:        elPropDueDay ? (parseInt(elPropDueDay.value) || 5) : 5,
    max_due_day:    elPropMaxDueDay ? (parseInt(elPropMaxDueDay.value) || 10) : 10,
    increase_notes: elPropIncreaseNotes ? elPropIncreaseNotes.value.trim() : '',
    damage_notes:   elPropDamageNotes ? elPropDamageNotes.value.trim() : ''
  };

  if (!payload.name) { toast('El nombre del inmueble no puede estar vacío', 'error'); return; }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner" style="width:14px; height:14px; border-width:2px; display:inline-block; margin-right:6px; vertical-align:middle;"></span> Guardando...';

  const applyToMemory = () => {
    const p = adminData.properties.find(x => String(x.id) === String(propId));
    if (p) {
      Object.assign(p, {
        name: payload.name, owner: payload.owner, owner_phone: payload.owner_phone, monthly_rent: payload.monthly_rent,
        deposit: payload.deposit, start_date: payload.start_date, duration: payload.duration,
        due_day: payload.due_day, max_due_day: payload.max_due_day,
        increase_notes: payload.increase_notes, damage_notes: payload.damage_notes
      });
      ensureUniqueIds(adminData);
      localStorage.setItem('icde_admin_data', JSON.stringify(adminData));
    }
  };

  applyToMemory();

  fetch(ADMIN_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  }).catch(e => null);

  toast('Inmueble guardado con éxito!', 'success');
  closeUnifiedModal();
  renderAdministracion();
}

"""
    content = content[:start_prop_pos] + new_prop_fn + content[end_prop_pos:]
    print("Updated saveAdminPropertyDetails in admin.html!")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Update nuevo_admin_apps_script.js and crm_apps_script.js
for fname in ["nuevo_admin_apps_script.js", "crm_apps_script.js"]:
    with open(fname, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace("const cleanName = String(params.propertyName).trim().toLowerCase();",
                  "const cleanName = String(params.propertyName || '').split('-')[0].replace(/1\\.\\s*\\|/g, '').trim().toLowerCase();")
    c = c.replace("const cleanName = String(params.propertyNameOld).trim().toLowerCase();",
                  "const cleanName = String(params.propertyNameOld || '').split('-')[0].replace(/1\\.\\s*\\|/g, '').trim().toLowerCase();")
    with open(fname, "w", encoding="utf-8") as f:
        f.write(c)

print("Done applying full admin save fix!")
