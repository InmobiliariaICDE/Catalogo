import openpyxl

wb = openpyxl.load_workbook("Pagos - Control.xlsx", data_only=True)
sheet = wb['ADMINISTRACION DETALLADA']
rows = [ [cell.value for cell in sheet[r]] for r in range(1, 6) ]

for r_idx, row in enumerate(rows):
    print(f"\nRow {r_idx + 1}:")
    for col_idx, val in enumerate(row):
        if val is not None:
            print(f"Col {col_idx}: {val}")
