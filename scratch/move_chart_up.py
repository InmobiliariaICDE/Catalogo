file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add static div for chart container in the HTML layout
old_kpis_div = """    <!-- KPI GRID DINÁMICO -->
    <div id="adminKpisContainer" style="margin-bottom: 14px;">
      <!-- Se llena dinámicamente -->
    </div>"""

new_kpis_div = """    <!-- KPI GRID DINÁMICO -->
    <div id="adminKpisContainer" style="margin-bottom: 14px;">
      <!-- Se llena dinámicamente -->
    </div>

    <!-- GRÁFICO DE COMISIONES -->
    <div id="adminChartContainer" style="margin-bottom: 14px; display: none;">
      <!-- Se llena dinámicamente -->
    </div>"""

content = content.replace(old_kpis_div, new_kpis_div)

# 2. Modify the javascript layout generation at the end of renderAdministracionContent
old_js_rendering = """  tabContent.innerHTML = `
    <!-- Comisión Chart Panel -->
    <div class="panel-section" style="margin-bottom:12px; padding:15px; border-radius:16px; background: linear-gradient(145deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.95) 100%); border: 1px solid rgba(255,255,255,0.06);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:var(--gold);">Comisiones de Administración (${currentAdminYear})</span>
        <span style="font-size:10px; color:var(--muted); font-weight:600;">Comisión Esperada (10% del esperado) vs. Recaudada</span>
      </div>
      <div style="height:140px; position:relative; width:100%;">
        <canvas id="adminComisionesChart"></canvas>
      </div>
    </div>
    
    ${renderMatrizPagos(filteredProperties)}
  `;"""

new_js_rendering = """  const chartContainer = document.getElementById('adminChartContainer');
  if (chartContainer) {
    chartContainer.style.display = 'block';
    chartContainer.innerHTML = `
      <div class="panel-section" style="padding:15px; border-radius:16px; background: linear-gradient(145deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.95) 100%); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:var(--gold);">Comisiones de Administración (${currentAdminYear})</span>
          <span style="font-size:10px; color:var(--muted); font-weight:600;">Comisión Esperada (10% del esperado) vs. Recaudada</span>
        </div>
        <div style="height:140px; position:relative; width:100%;">
          <canvas id="adminComisionesChart"></canvas>
        </div>
      </div>
    `;
  }

  tabContent.innerHTML = renderMatrizPagos(filteredProperties);"""

content = content.replace(old_js_rendering, new_js_rendering)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
