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

idx_inmo = header.index('Inmobiliaria')
idx_cel1 = header.index('CELULAR')
idx_cel2 = header.index('CELULAR 2')
idx_prop = header.index('PROPIETARIO')
idx_cod = header.index('Código')

def clean_phone(val):
    if val is None:
        return ""
    val_str = str(val).strip()
    if val_str.endswith('.0'):
        val_str = val_str[:-2]
    if val_str == "0" or val_str == "nan":
        return ""
    return val_str

data = []
for idx, r in enumerate(rows[1:], start=2):
    cod = str(r[idx_cod]).strip() if r[idx_cod] is not None else ""
    inmo = str(r[idx_inmo]).strip() if r[idx_inmo] is not None else ""
    cel1 = clean_phone(r[idx_cel1])
    cel2 = clean_phone(r[idx_cel2])
    prop = str(r[idx_prop]).strip() if r[idx_prop] is not None else ""
    
    data.append({
        'row': idx,
        'code': cod,
        'inmobiliaria': inmo,
        'celular1': cel1,
        'celular2': cel2,
        'propietario': prop
    })

df = pd.DataFrame(data)

print("Total rows in Base de Datos:", len(df))
print("Rows with non-empty Inmobiliaria:", len(df[df['inmobiliaria'] != ""]))
print("Rows with non-empty Celular 1:", len(df[df['celular1'] != ""]))
print("Rows with non-empty Celular 2:", len(df[df['celular2'] != ""]))

# Let's inspect rows where inmobiliaria is NOT empty
inmo_rows = df[df['inmobiliaria'] != ""]

# Print every row with inmobiliaria non-empty
print("\n--- ALL ROWS WITH INMOBILIARIA NON-EMPTY ---")
for idx, row in inmo_rows.iterrows():
    print(f"Row {row['row']} | Code: {row['code']} | Inmo: {row['inmobiliaria']} | Cel1: {row['celular1']} | Cel2: {row['celular2']} | Prop: {row['propietario']}")
