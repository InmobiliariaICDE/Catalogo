file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update getMonthlyComisionesData (around line 9134)
old_chart_calc = """        } else if (st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE') {
          expected[mIdx] += rent;
          if (val > 0) {
            collected[mIdx] += val;
          }
        }"""

new_chart_calc = """        } else if (st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE') {
          expected[mIdx] += rent;
          if (val > 0) {
            collected[mIdx] += val;
          }
        } else if (st === 'DELIVERY') {
          // En Entrega no se cobra canon ese mes (no suma a expected)
          if (val > 0) {
            collected[mIdx] += val;
          }
        }"""

if old_chart_calc in content:
    content = content.replace(old_chart_calc, new_chart_calc)
    print("Updated getMonthlyComisionesData")
else:
    print("Could not find old_chart_calc in admin.html!")

# 2. Update renderAdministracionContent KPI loop (around line 9252)
old_kpi_calc = """      } else if (st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA') {
        totalEsperado += rent;
        if (val > 0) { totalRecaudado += val; }
        ocupados++; totalActivos++;
        if (isSilvia) {
          silviaEsperado += rent;
          if (val > 0) { silviaRecaudado += val; }
          silviaOcupados++; silviaActivos++;
        }
      }"""

new_kpi_calc = """      } else if (st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA') {
        totalEsperado += rent;
        if (val > 0) { totalRecaudado += val; }
        ocupados++; totalActivos++;
        if (isSilvia) {
          silviaEsperado += rent;
          if (val > 0) { silviaRecaudado += val; }
          silviaOcupados++; silviaActivos++;
        }
      } else if (st === 'DELIVERY') {
        // En Entrega no se cobra canon ese mes (no suma a canon esperado)
        if (val > 0) { totalRecaudado += val; }
        ocupados++; totalActivos++;
        if (isSilvia) {
          if (val > 0) { silviaRecaudado += val; }
          silviaOcupados++; silviaActivos++;
        }
      }"""

if old_kpi_calc in content:
    content = content.replace(old_kpi_calc, new_kpi_calc)
    print("Updated renderAdministracionContent KPI loop")
else:
    print("Could not find old_kpi_calc in admin.html!")

# 3. Update contObtenerComisionAdministracionEsperada (around line 15406)
old_cont_calc = """if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE') {"""
new_cont_calc = """if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE') {"""

# Replace in contObtenerComisionAdministracionEsperada and contGetParaAno
old_cont_line1 = """          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE') {
            totalEsperado += rent * 0.10;
          }"""

new_cont_line1 = """          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE') {
            totalEsperado += rent * 0.10;
          }"""

old_cont_block = """          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE') {
            totalEsperado += rent * 0.10;
          }"""
new_cont_block = """          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE') {
            totalEsperado += rent * 0.10;
          }"""

# Let's replace DELIVERY in the two contability functions:
cont_target1 = """          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE') {\n            totalEsperado += rent * 0.10;"""
cont_replacement1 = """          if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE') {\n            totalEsperado += rent * 0.10;"""

if "st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE'" in content:
    content = content.replace(
        "if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE')",
        "if (st === 'PAID' || st === 'PENDING' || st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'AL_DIA' || st === 'FUTURE')"
    )
    print("Updated contability helper functions")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
