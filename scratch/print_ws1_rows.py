import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook("Lista_Inmobiliarias_y_Telefonos_ICDE.xlsx")
ws = wb["Resumen Inmobiliarias"]

for r_idx, r in enumerate(ws.iter_rows(values_only=True), start=1):
    vals = [v for v in r if v is not None and str(v).strip() != ""]
    print(f"Row {r_idx:2d}: {vals}")
