import json
import csv
import glob

print("=== CHECKING CSV & OTHER JSON FILES ===")

json_files = glob.glob("*.json")
for jf in json_files:
    print(f"\n--- Checking JSON: {jf} ---")
    try:
        with open(jf, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            for kw in ['portal del campo', 'portal', 'nogal', 'nogales', 'campo']:
                c = content.lower().count(kw)
                if c > 0:
                    print(f"  Keyword '{kw}': count={c}")
    except Exception as e:
        print(f"Error reading {jf}:", e)

csv_files = glob.glob("*.csv")
for cf in csv_files:
    print(f"\n--- Checking CSV: {cf} ---")
    try:
        with open(cf, 'r', encoding='utf-8', errors='ignore') as f:
            r = csv.reader(f)
            for row_idx, row in enumerate(r):
                row_str = " ".join(row).lower()
                for kw in ['portal del campo', 'portal', 'nogal', 'nogales', 'campo']:
                    if kw in row_str:
                        print(f"  Row {row_idx} ({kw}): {row_str[:120]}")
    except Exception as e:
        print(f"Error reading {cf}:", e)
