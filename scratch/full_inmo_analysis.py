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
idx_nombre = header.index('Nombre') if 'Nombre' in header else -1
idx_tipo = header.index('Tipo de inmueble') if 'Tipo de inmueble' in header else -1
idx_barrio = header.index('Barrio') if 'Barrio' in header else -1

def clean_phone(val):
    if val is None:
        return ""
    val_str = str(val).strip()
    if val_str.endswith('.0'):
        val_str = val_str[:-2]
    if val_str in ["0", "nan", "None", "0.0"]:
        return ""
    return val_str

all_inmo_data = []

for idx, r in enumerate(rows[1:], start=2):
    inmo_raw = str(r[idx_inmo]).strip() if r[idx_inmo] is not None else ""
    cel1 = clean_phone(r[idx_cel1])
    cel2 = clean_phone(r[idx_cel2])
    prop = str(r[idx_prop]).strip() if r[idx_prop] is not None else ""
    cod = str(r[idx_cod]).strip() if r[idx_cod] is not None else ""
    nombre = str(r[idx_nombre]).strip() if idx_nombre != -1 and r[idx_nombre] is not None else ""
    tipo = str(r[idx_tipo]).strip() if idx_tipo != -1 and r[idx_tipo] is not None else ""
    barrio = str(r[idx_barrio]).strip() if idx_barrio != -1 and r[idx_barrio] is not None else ""
    
    if inmo_raw and inmo_raw != "None":
        all_inmo_data.append({
            'Fila_Excel': idx,
            'Código': cod,
            'Nombre_Inmueble': nombre,
            'Tipo_Inmueble': tipo,
            'Barrio': barrio,
            'Inmobiliaria_Original': inmo_raw,
            'Celular_1': cel1,
            'Celular_2': cel2,
            'Propietario': prop
        })

df_all = pd.DataFrame(all_inmo_data)
print(f"Total rows with Inmobiliaria: {len(df_all)}")
print("\nUnique Inmobiliaria_Original count:", df_all['Inmobiliaria_Original'].nunique())
print("\nUnique values and row counts:")
inmo_counts = df_all['Inmobiliaria_Original'].value_counts()
for name, cnt in inmo_counts.items():
    cels1 = set(df_all[df_all['Inmobiliaria_Original'] == name]['Celular_1']) - {""}
    cels2 = set(df_all[df_all['Inmobiliaria_Original'] == name]['Celular_2']) - {""}
    all_cels = sorted(list(cels1 | cels2))
    print(f"[{cnt} inmuebles] {name} -> Celulares: {all_cels}")
