import openpyxl

wb = openpyxl.load_workbook('Pagos - Control.xlsx', data_only=True)
ws = wb['ADMINISTRACION DETALLADA']

print("=== ALL COLUMNS IN Pagos - Control.xlsx SHEET 'ADMINISTRACION DETALLADA' ===")
for r in range(5, 28):
    row_vals = [ws.cell(r, c).value for c in range(1, 18)]
    print(f"Row {r:2d} | Col A(ID): {str(row_vals[0]):<3} | Col G(Propietario): {str(row_vals[6]):<20} | Col H: {str(row_vals[7]):<15} | Col I(Inmueble): {str(row_vals[8]):<30} | Col J(Inquilino): {str(row_vals[9]):<12} | Col K: {str(row_vals[10]):<10} | Col Q(Canon): {str(row_vals[16])}")
