import os
import sys
import openpyxl
import pandas as pd
import re

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

def clean_phone(val):
    if val is None:
        return ""
    val_str = str(val).strip()
    if val_str.endswith('.0'):
        val_str = val_str[:-2]
    if val_str == "0":
        return ""
    return val_str

all_rows = []
for idx, r in enumerate(rows[1:], start=2):
    inmo = str(r[idx_inmo]).strip() if r[idx_inmo] is not None else ""
    cel1 = clean_phone(r[idx_cel1])
    cel2 = clean_phone(r[idx_cel2])
    prop = str(r[idx_prop]).strip() if r[idx_prop] is not None else ""
    cod = str(r[0]).strip() if r[0] is not None else ""
    
    if inmo or cel1 or cel2:
        all_rows.append({
            'row_num': idx,
            'code': cod,
            'inmobiliaria': inmo,
            'celular1': cel1,
            'celular2': cel2,
            'propietario': prop
        })

df = pd.DataFrame(all_rows)

print(f"Total rows extracted: {len(df)}")
print("\n--- Rows with Inmobiliaria filled ---")
inmo_df = df[df['inmobiliaria'] != ""]
print(f"Rows with non-empty Inmobiliaria: {len(inmo_df)}")

print("\n--- Summary of unique Inmobiliaria entries ---")
grouped = inmo_df.groupby('inmobiliaria').agg({
    'code': 'count',
    'celular1': lambda x: sorted(list(set([c for c in x if c]))),
    'celular2': lambda x: sorted(list(set([c for c in x if c]))),
    'propietario': lambda x: sorted(list(set([p for p in x if p])))
}).reset_index()

grouped.columns = ['Inmobiliaria', 'Cantidad_Inmuebles', 'Celulares_1', 'Celulares_2', 'Propietarios']

print(grouped.to_string())
