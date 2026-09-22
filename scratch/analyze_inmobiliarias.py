import os
import sys
import openpyxl
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

target_file = [f for f in os.listdir('.') if f.startswith('Matriz') and f.endswith('.xlsx')][0]
wb = openpyxl.load_workbook(target_file, data_only=True, read_only=True)
ws = wb['Base de Datos']

rows = list(ws.iter_rows(values_only=True))
header = rows[0]

# Find indices
idx_inmo = header.index('Inmobiliaria')
idx_cel1 = header.index('CELULAR')
idx_cel2 = header.index('CELULAR 2')
idx_prop = header.index('PROPIETARIO') if 'PROPIETARIO' in header else -1
idx_cod = header.index('Código') if 'Código' in header else -1

print(f"Indices: Inmobiliaria={idx_inmo}, CELULAR={idx_cel1}, CELULAR 2={idx_cel2}")

records = []
for r_idx, row in enumerate(rows[1:], start=2):
    inmo = str(row[idx_inmo]).strip() if row[idx_inmo] is not None else ""
    cel1 = str(row[idx_cel1]).strip() if row[idx_cel1] is not None else ""
    cel2 = str(row[idx_cel2]).strip() if row[idx_cel2] is not None else ""
    prop = str(row[idx_prop]).strip() if idx_prop != -1 and row[idx_prop] is not None else ""
    cod = str(row[idx_cod]).strip() if idx_cod != -1 and row[idx_cod] is not None else ""
    
    if inmo or cel1 or cel2:
        records.append({
            'row': r_idx,
            'Código': cod,
            'Inmobiliaria': inmo,
            'CELULAR': cel1,
            'CELULAR 2': cel2,
            'PROPIETARIO': prop
        })

df = pd.DataFrame(records)
print(f"Total rows with data in any of the fields: {len(df)}")

print("\nSample records with Inmobiliaria non-empty:")
print(df[df['Inmobiliaria'] != ""].head(20).to_string())

print("\nUnique Inmobiliaria values:")
print(df['Inmobiliaria'].unique())
