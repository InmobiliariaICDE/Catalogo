import os
import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

target_file = [f for f in os.listdir('.') if f.startswith('Matriz') and f.endswith('.xlsx')][0]
wb = openpyxl.load_workbook(target_file, data_only=True, read_only=True)
ws = wb['Base de Datos']

headers = list(next(ws.iter_rows(values_only=True)))

print("Total columns:", len(headers))
for i, h in enumerate(headers):
    print(f"Col {i}: {repr(h)}")
