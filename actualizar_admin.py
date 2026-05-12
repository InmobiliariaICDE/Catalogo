import pandas as pd
import json
import os
from datetime import datetime

def parse_admin_detailed(file):
    if not os.path.exists(file):
        print(f"File {file} not found")
        return []
    
    xl = pd.ExcelFile(file)
    if 'ADMINISTRACION DETALLADA' not in xl.sheet_names:
        print(f"Sheet 'ADMINISTRACION DETALLADA' not found in {file}")
        return []
    
    df = pd.read_excel(file, sheet_name='ADMINISTRACION DETALLADA', header=None)
    
    # The data usually starts from row 4 (index 4 in 0-indexed)
    # But let's find the row that starts with '1' in column 0
    start_row = 0
    for i, row in df.iterrows():
        if str(row[0]) == '1' and str(row[1]) == 'nan' and str(row[2]) == 'nan':
            # This looks like the first data row
            # Wait, there are multiple '1's if it's numbered.
            # Based on the CSV, the first '1' is at row index 4.
            start_row = i
            break
    
    properties = []
    # Data rows are usually from start_row to around row 25
    for i in range(start_row, 30):
        row = df.iloc[i]
        if pd.isna(row[5]) and pd.isna(row[6]):
            continue
            
        prop_name_raw = str(row[6]) if not pd.isna(row[6]) else ""
        # Clean up property name (it contains notes about increases)
        prop_parts = prop_name_raw.split('.')
        prop_name = prop_parts[0].strip()
        
        # If it says "DESOCUPADO", it might be different
        if "DESOCUPADO" in prop_name.upper():
             status = "Desocupado"
        else:
             status = "Ocupado"

        # Tenant name is usually in the notes or implied. 
        # In this sheet, column 5 (Jorge Luis, Marcos, etc.) seems to be the OWNER or the ADMIN.
        # Let's assume for now column 5 is the person to contact.
        
        properties.append({
            "id": str(row[0]),
            "owner": str(row[5]),
            "name": prop_name,
            "notes": prop_name_raw,
            "duration": str(row[7]),
            "deposit": str(row[8]),
            "start_date": str(row[9]),
            "monthly_rent": str(row[12]),
            "status": status,
            # We could extract payment history here if needed
        })
        
    return properties

def main():
    print("Iniciando extracción de datos de administración...")
    
    all_data = {
        "last_update": datetime.now().isoformat(),
        "properties": []
    }
    
    # 1. Parse Pagos - Control.xlsx
    all_data["properties"] = parse_admin_detailed("Pagos - Control.xlsx")
    
    # 2. Save to JSON
    with open("admin_data.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=4, ensure_ascii=False)
        
    print(f"Datos guardados en admin_data.json. Total propiedades: {len(all_data['properties'])}")

if __name__ == "__main__":
    main()
