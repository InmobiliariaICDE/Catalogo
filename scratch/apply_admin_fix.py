import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update mergeLocalAdminData to sanitize all properties and avoid pushing broken ghost properties
old_merge_code = """function mergeLocalAdminData(freshData) {
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
}"""

new_merge_code = """function mergeLocalAdminData(freshData) {
  if (!freshData || !Array.isArray(freshData.properties)) return freshData || { properties: [], silvia_ledger: {} };
  
  // Sanear cada propiedad devuelta por la fuente principal
  freshData.properties.forEach(p => {
    p.name = p.name ? String(p.name).trim() : 'Propiedad Sin Nombre';
    p.owner = p.owner ? String(p.owner).trim() : '';
    p.tenant_name = p.tenant_name ? String(p.tenant_name).trim() : '';
    p.monthly_rent = parseFloat(p.monthly_rent) || 0;
    p.payments = p.payments || {};
  });

  const cachedStr = localStorage.getItem('icde_admin_data');
  if (!cachedStr) return freshData;
  try {
    const cachedData = JSON.parse(cachedStr);
    if (!cachedData || !Array.isArray(cachedData.properties)) return freshData;

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
                }
              });
            }
          });
        }
      }
    });
  } catch(e) {
    console.warn("Error en mergeLocalAdminData:", e);
  }
  return freshData;
}"""

if old_merge_code in content:
    content = content.replace(old_merge_code, new_merge_code)
    print("Updated mergeLocalAdminData!")
else:
    print("WARNING: old_merge_code not found exactly, doing fallback search...")

# 2. Update renderAdministracionContent filter to prevent TypeError on missing fields
old_filter_code = """  const filteredProperties = adminData.properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal) ||
                          (p.owner && p.owner.toLowerCase().includes(searchVal)) ||
                          (p.owner_phone && p.owner_phone.includes(searchVal)) ||
                          (p.tenant_name && p.tenant_name.toLowerCase().includes(searchVal)) ||
                          (p.tenant_phone && p.tenant_phone.includes(searchVal)) ||
                          (p.increase_notes && p.increase_notes.toLowerCase().includes(searchVal));
    if (!matchesSearch) return false;"""

new_filter_code = """  const filteredProperties = (adminData.properties || []).filter(p => {
    if (!p) return false;
    const pName = String(p.name || '').toLowerCase();
    const pOwner = String(p.owner || '').toLowerCase();
    const pOwnerPhone = String(p.owner_phone || '');
    const pTenant = String(p.tenant_name || '').toLowerCase();
    const pTenantPhone = String(p.tenant_phone || '');
    const pNotes = String(p.increase_notes || '').toLowerCase();

    const matchesSearch = !searchVal || 
                          pName.includes(searchVal) ||
                          pOwner.includes(searchVal) ||
                          pOwnerPhone.includes(searchVal) ||
                          pTenant.includes(searchVal) ||
                          pTenantPhone.includes(searchVal) ||
                          pNotes.includes(searchVal);
    if (!matchesSearch) return false;"""

if old_filter_code in content:
    content = content.replace(old_filter_code, new_filter_code)
    print("Updated filteredProperties search logic!")
else:
    print("WARNING: old_filter_code not found exactly!")

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved changes to admin.html!")
