file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the entire kpisContainer.innerHTML rendering block
old_kpi_rendering_block = """  kpisContainer.innerHTML = `
    <div class="admin-kpis-layout">
      <!-- Standard Cards Grid -->
      <div class="admin-kpis-left">
        <!-- 1. INMUEBLES ADMINISTRADOS -->
        <div class="admin-kpi-card" style="--card-accent: var(--gold);">
          <div class="admin-kpi-val">${totalActivos}</div>
          <div class="admin-kpi-lbl">Inmuebles Administrados</div>
          <div class="admin-kpi-sub" style="font-weight:600;">
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="font-size:8px; line-height:1;">🟢</span> ${ocupados} ocupados de ${totalActivos} unidades (${ocupacionPorcentaje}%)</span>
          </div>
        </div>

        <!-- 2. COMISIÓN TOTAL ACUMULADA -->
        <div class="admin-kpi-card" style="--card-accent: var(--gold);">
          <div class="admin-kpi-val" style="display: flex; align-items: baseline; gap: 4px;">
            <span>${safeFormatP(totalComision)}</span>
            <span style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 2px;">/</span>
            <span style="color: #22c55e;">${safeFormatP(totalEsperado * 0.10)}</span>
          </div>
          <div class="admin-kpi-lbl">Comisión Acumulada / Esperada</div>
          <div class="admin-kpi-sub">Llevo acumulado vs. Total esperado del mes</div>
        </div>

        <!-- 3. CANON ESPERADO -->
        <div class="admin-kpi-card" style="--card-accent: var(--gold);">
          <div class="admin-kpi-val">${safeFormatP(totalEsperado)}</div>
          <div class="admin-kpi-lbl">Canon Esperado (${currentAdminMonth})</div>
          <div class="admin-kpi-sub">Total facturado este mes</div>
        </div>

        <!-- 4. RECAUDADO EFECTIVO -->
        <div class="admin-kpi-card" style="border-color: rgba(34,197,94,0.3); --card-accent: #22c55e;">
          <div class="admin-kpi-val" style="color: #22c55e;">${safeFormatP(totalRecaudado)}</div>
          <div class="admin-kpi-lbl">Recaudado Efectivo</div>
          <div class="admin-kpi-sub">🟢 Cobros liquidados con éxito</div>
        </div>

        <!-- 5. CARTERA PENDIENTE -->
        <div class="admin-kpi-card" style="border-color: ${totalPendiente > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,75,0.15)'}; --card-accent: ${totalPendiente > 0 ? '#ef4444' : 'var(--gold)'};">
          <div class="admin-kpi-val" style="color: ${totalPendiente > 0 ? '#ef4444' : '#fff'};">${safeFormatP(totalPendiente)}</div>
          <div class="admin-kpi-lbl">Cartera Pendiente</div>
          <div class="admin-kpi-sub">${totalPendiente > 0 ? '🔴 Inquilinos con mora activa' : '✓ Arrendatarios al día'}</div>
        </div>

        <!-- 6. EDIFICIO SILVIA -->
        <div class="admin-kpi-card" style="border-color: rgba(245,158,11,0.3); --card-accent: #f59e0b; display: flex; flex-direction: column; gap: 8px; justify-content: center;">
          <div class="admin-kpi-lbl" style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b; margin-bottom: 2px;">Edificio Silvia</div>
          
          <div style="display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.85); width: 100%;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
              <span>Inmuebles Administrados:</span>
              <strong style="color: #fff;">${silviaActivos} (${silviaOcupados} ocupados)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
              <span>Canon Esperado:</span>
              <strong style="color: #fff;">${safeFormatP(silviaEsperado)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
              <span>Recaudado Efectivo:</span>
              <strong style="color: #22c55e;">${safeFormatP(silviaRecaudado)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
              <span>Cartera Pendiente:</span>
              <strong style="color: ${silviaPendiente > 0 ? '#ef4444' : '#fff'};">${safeFormatP(silviaPendiente)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-bottom: 1px;">
              <span>Comisión Acumulada (10%):</span>
              <strong style="color: #eab308;">${safeFormatP(silviaRecaudado * 0.10)}</strong>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Tall Column (Objetivo de Administración Chart) -->
      <div class="admin-kpis-right">
        <div class="admin-kpi-card" style="--card-accent: var(--gold); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 12px 10px;">
          <div class="admin-kpi-lbl" style="margin-bottom: 4px; width: 100%; text-align: left; border-left: 3px solid var(--gold); padding-left: 6px;">Objetivo de Administración</div>
          
          <div style="position:relative; width:58px; height:58px; display:flex; align-items:center; justify-content:center; margin: 2px 0;">
            <svg width="58" height="58" viewBox="0 0 100 100" style="transform: rotate(-90deg); width:100%; height:100%;">
              <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.04)" stroke-width="8"/>
              <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--gold)" stroke-width="8"
                      stroke-dasharray="263.89" stroke-dashoffset="${dashOffset}"
                      stroke-linecap="round" style="transition: stroke-dashoffset 0.8s ease-in-out; filter: drop-shadow(0 0 4px rgba(212,168,75,0.25));"/>
            </svg>
            <div style="position:absolute; font-size:19px; font-weight:800; color:#fff; letter-spacing:-0.03em;">
              ${progressPercent}%
            </div>
          </div>
          
          <div style="font-size:11px; color:var(--muted); font-weight:600; margin-top: 2px;">
            Objetivo mensual: <span style="color:var(--gold); font-weight:700;">$2.000.000</span>
          </div>
        </div>
      </div>
    </div>
  `;"""

new_kpi_rendering_block = """  kpisContainer.innerHTML = `
    <div class="admin-kpis-left">
      <!-- 1. INMUEBLES ADMINISTRADOS -->
      <div class="admin-kpi-card" style="--card-accent: var(--gold);">
        <div class="admin-kpi-val">${totalActivos}</div>
        <div class="admin-kpi-lbl">Inmuebles Administrados</div>
        <div class="admin-kpi-sub" style="font-weight:600;">
          <span style="display:inline-flex; align-items:center; gap:4px;"><span style="font-size:8px; line-height:1;">🟢</span> ${ocupados} ocupados de ${totalActivos} unidades (${ocupacionPorcentaje}%)</span>
        </div>
      </div>

      <!-- 2. COMISIÓN TOTAL ACUMULADA Y OBJETIVO -->
      <div class="admin-kpi-card" style="--card-accent: var(--gold); display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px;">
        <div style="display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0;">
          <div class="admin-kpi-val" style="display: flex; align-items: baseline; gap: 3px; font-size: 19px; line-height: 1.1; margin-bottom: 2px;">
            <span>${safeFormatP(totalComision)}</span>
            <span style="color: #22c55e; font-size: 13px; font-weight: 600; margin: 0 1px;">/</span>
            <span style="color: #22c55e; font-size: 19px;">${safeFormatP(totalEsperado * 0.10)}</span>
          </div>
          <div class="admin-kpi-lbl" style="font-size: 11px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Comisión Acumulada / Esperada</div>
          <div class="admin-kpi-sub" style="font-size: 10px; line-height: 1.2;">Llevo acumulado vs. Esperado</div>
        </div>
        
        <!-- SVG Progress Chart inside the card -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; position: relative; width: 44px; height: 44px; margin-left: 2px;">
          <svg width="44" height="44" viewBox="0 0 100 100" style="transform: rotate(-90deg); width:100%; height:100%;">
            <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.04)" stroke-width="8"/>
            <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--gold)" stroke-width="8"
                    stroke-dasharray="263.89" stroke-dashoffset="${dashOffset}"
                    stroke-linecap="round" style="transition: stroke-dashoffset 0.8s ease-in-out; filter: drop-shadow(0 0 3px rgba(212,168,75,0.25));"/>
          </svg>
          <div style="position: absolute; font-size: 12px; font-weight: 800; color: #fff; text-align: center; line-height: 1;">
            ${progressPercent}%
          </div>
          <div style="font-size: 6px; color: var(--muted); font-weight: 700; white-space: nowrap; margin-top: 1px; position: absolute; bottom: -10px;">
            Meta: $2M
          </div>
        </div>
      </div>

      <!-- 3. CANON ESPERADO -->
      <div class="admin-kpi-card" style="--card-accent: var(--gold);">
        <div class="admin-kpi-val">${safeFormatP(totalEsperado)}</div>
        <div class="admin-kpi-lbl">Canon Esperado (${currentAdminMonth})</div>
        <div class="admin-kpi-sub">Total facturado este mes</div>
      </div>

      <!-- 4. RECAUDADO EFECTIVO -->
      <div class="admin-kpi-card" style="border-color: rgba(34,197,94,0.3); --card-accent: #22c55e;">
        <div class="admin-kpi-val" style="color: #22c55e;">${safeFormatP(totalRecaudado)}</div>
        <div class="admin-kpi-lbl">Recaudado Efectivo</div>
        <div class="admin-kpi-sub">🟢 Cobros liquidados con éxito</div>
      </div>

      <!-- 5. CARTERA PENDIENTE -->
      <div class="admin-kpi-card" style="border-color: ${totalPendiente > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,75,0.15)'}; --card-accent: ${totalPendiente > 0 ? '#ef4444' : 'var(--gold)'};">
        <div class="admin-kpi-val" style="color: ${totalPendiente > 0 ? '#ef4444' : '#fff'};">${safeFormatP(totalPendiente)}</div>
        <div class="admin-kpi-lbl">Cartera Pendiente</div>
        <div class="admin-kpi-sub">${totalPendiente > 0 ? '🔴 Inquilinos con mora activa' : '✓ Arrendatarios al día'}</div>
      </div>

      <!-- 6. EDIFICIO SILVIA -->
      <div class="admin-kpi-card" style="border-color: rgba(245,158,11,0.3); --card-accent: #f59e0b; display: flex; flex-direction: column; gap: 8px; justify-content: center;">
        <div class="admin-kpi-lbl" style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b; margin-bottom: 2px;">Edificio Silvia</div>
        
        <div style="display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.85); width: 100%;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
            <span>Inmuebles Administrados:</span>
            <strong style="color: #fff;">${silviaActivos} (${silviaOcupados} ocupados)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
            <span>Canon Esperado:</span>
            <strong style="color: #fff;">${safeFormatP(silviaEsperado)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
            <span>Recaudado Efectivo:</span>
            <strong style="color: #22c55e;">${safeFormatP(silviaRecaudado)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 3px;">
            <span>Cartera Pendiente:</span>
            <strong style="color: ${silviaPendiente > 0 ? '#ef4444' : '#fff'};">${safeFormatP(silviaPendiente)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 1px;">
            <span>Comisión Acumulada (10%):</span>
            <strong style="color: #eab308;">${safeFormatP(silviaRecaudado * 0.10)}</strong>
          </div>
        </div>
      </div>
    </div>
  `;"""

content = content.replace(old_kpi_rendering_block, new_kpi_rendering_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
