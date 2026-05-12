import pandas as pd
import os

files = ["Pagos - Control.xlsx", "Edif. Silvia - Pagos Admt. CRA7 No. 33-20.xlsx"]

def find_data(file):
    if not os.path.exists(file):
        return
    print(f"\n===== Analyzing {file} =====")
    xl = pd.ExcelFile(file)
    for sheet in xl.sheet_names:
        df = pd.read_excel(file, sheet_name=sheet)
        # Find rows with more than 3 non-NaN values
        mask = df.notnull().sum(axis=1) > 3
        data_rows = df[mask]
        if not data_rows.empty:
            print(f"--- Sheet: {sheet} (Found {len(data_rows)} potential data rows) ---")
            print(data_rows.head(10))
            print(data_rows.columns.tolist())

for f in files:
    find_data(f)
