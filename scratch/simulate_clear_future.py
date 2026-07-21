import openpyxl
import subprocess

file_path = "Base de datos Admin.xlsx"
wb = openpyxl.load_workbook(file_path)
ws = wb['ADMINISTRACION DETALLADA']

# Clear columns 64 to 68 of row 22 (August to December 2026)
for col in range(64, 69):
    ws.cell(row=22, column=col).value = "-"

wb.save(file_path)
print("Cleared Goya's future months in Excel!")

# Run data update
subprocess.run(["python", "actualizar_admin.py"])
