import re

file_path = r'c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add helper functions and update eliminarLead
helpers = """function getDeletedLeadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem('icde_leads_eliminados') || '[]'));
  } catch(e) {
    return new Set();
  }
}

function getDeletedLeadPhones() {
  try {
    return new Set(JSON.parse(localStorage.getItem('icde_telefonos_eliminados') || '[]'));
  } catch(e) {
    return new Set();
  }
}

function marcarLeadEliminadoLocal(id, celular) {
  if (id) {
    const ids = getDeletedLeadIds();
    ids.add(String(id).trim());
    try { localStorage.setItem('icde_leads_eliminados', JSON.stringify(Array.from(ids))); } catch(e){}
  }
  if (celular) {
    const cleanCel = String(celular).replace(/\\D/g, '');
    if (cleanCel) {
      const phones = getDeletedLeadPhones();
      phones.add(cleanCel);
      if (cleanCel.length >= 10) phones.add(cleanCel.slice(-10));
      try { localStorage.setItem('icde_telefonos_eliminados', JSON.stringify(Array.from(phones))); } catch(e){}
    }
  }
}

async function eliminarLead(id){"""

content = content.replace("async function eliminarLead(id){", helpers)

# 2. Add local deletion marking in eliminarLead right after console.log Marcando para eliminación
mark_pattern = r"(console\.log\('\[eliminarLead\] Marcando para eliminación en la nube IDs:', idsABorrar\);)"
mark_replacement = r"""\1

  marcarLeadEliminadoLocal(id, celularABorrar);
  if (idsABorrar && idsABorrar.length) {
    idsABorrar.forEach(idItem => marcarLeadEliminadoLocal(idItem, celularABorrar));
  }"""

content, count1 = re.subn(mark_pattern, mark_replacement, content)
print(f"Mark replacement count: {count1}")

# 3. Update syncSheets to check for deleted leads
sync_pattern = r"async function syncSheets\(lead\)\s*\{\s*if\(!CRM_SCRIPT_URL\) return;"
sync_replacement = r"""async function syncSheets(lead){
  if(!CRM_SCRIPT_URL || !lead) return;
  const deletedIds = getDeletedLeadIds();
  const deletedPhones = getDeletedLeadPhones();
  const lid = String(lead.id || '').trim();
  const lcel = String(lead.celular || '').replace(/\D/g, '');
  if (lid && deletedIds.has(lid)) return;
  if (lcel && (deletedPhones.has(lcel) || (lcel.length >= 10 && deletedPhones.has(lcel.slice(-10))))) return;"""

content, count2 = re.subn(sync_pattern, lambda m: sync_replacement, content)
print(f"SyncSheets replacement count: {count2}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("admin.html updated successfully!")
