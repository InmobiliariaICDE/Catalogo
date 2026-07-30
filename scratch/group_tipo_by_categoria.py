file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update contRenderResumen sorting logic
old_resumen_sort = """  } else if (contSortOrder === 'tipo') {
    txList.sort((a,b) => (a.tipo||'').localeCompare(b.tipo||''));
  } else if (contSortOrder === 'categoria') {
    txList.sort((a,b) => (a.categoria||'').localeCompare(b.categoria||''));"""

new_resumen_sort = """  } else if (contSortOrder === 'tipo') {
    txList.sort((a,b) => {
      const tComp = (a.tipo||'').localeCompare(b.tipo||'');
      if (tComp !== 0) return tComp;
      const cComp = (a.categoria||'').localeCompare(b.categoria||'');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha||0) - new Date(a.fecha||0);
    });
  } else if (contSortOrder === 'categoria') {
    txList.sort((a,b) => {
      const cComp = (a.categoria||'').localeCompare(b.categoria||'');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha||0) - new Date(a.fecha||0);
    });"""

if old_resumen_sort in content:
    content = content.replace(old_resumen_sort, new_resumen_sort)
    print("Updated contRenderResumen sorting!")
else:
    print("WARNING: old_resumen_sort not found")

# 2. Update contSeleccionarMesYVerMovimientos sorting logic (Month Detail Modal)
old_modal_sort = """  } else if (contDetalleMesSortOrder === 'tipo') {
    listaMes.sort(function(a, b) {
      return (a.tipo || '').localeCompare(b.tipo || '');
    });
  } else if (contDetalleMesSortOrder === 'categoria') {
    listaMes.sort(function(a, b) {
      return (a.categoria || '').localeCompare(b.categoria || '');
    });"""

new_modal_sort = """  } else if (contDetalleMesSortOrder === 'tipo') {
    listaMes.sort(function(a, b) {
      const tComp = (a.tipo || '').localeCompare(b.tipo || '');
      if (tComp !== 0) return tComp;
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  } else if (contDetalleMesSortOrder === 'categoria') {
    listaMes.sort(function(a, b) {
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });"""

if old_modal_sort in content:
    content = content.replace(old_modal_sort, new_modal_sort)
    print("Updated Month Detail Modal sorting!")
else:
    print("WARNING: old_modal_sort not found")

# 3. Update contRenderMovimientos sorting logic
old_movs_sort = """  } else if (contSortOrder === 'tipo') {
    lista.sort(function(a,b){
      return (a.tipo || '').localeCompare(b.tipo || '');
    });
  } else if (contSortOrder === 'categoria') {
    lista.sort(function(a,b){
      return (a.categoria || '').localeCompare(b.categoria || '');
    });"""

new_movs_sort = """  } else if (contSortOrder === 'tipo') {
    lista.sort(function(a,b){
      const tComp = (a.tipo || '').localeCompare(b.tipo || '');
      if (tComp !== 0) return tComp;
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  } else if (contSortOrder === 'categoria') {
    lista.sort(function(a,b){
      const cComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (cComp !== 0) return cComp;
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });"""

if old_movs_sort in content:
    content = content.replace(old_movs_sort, new_movs_sort)
    print("Updated contRenderMovimientos sorting!")
else:
    print("WARNING: old_movs_sort not found")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating admin.html!")
