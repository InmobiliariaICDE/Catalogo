import os
import sys
import zipfile
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

tmp_dir = r"C:\Users\USUARIO\AppData\Local\Temp"
for f in os.listdir(tmp_dir):
    full_path = os.path.join(tmp_dir, f)
    if os.path.isfile(full_path) and os.path.getsize(full_path) > 1000:
        try:
            if zipfile.is_zipfile(full_path):
                zf = zipfile.ZipFile(full_path)
                names = zf.namelist()
                if 'xl/workbook.xml' in names or '[Content_Types].xml' in names:
                    mtime = os.path.getmtime(full_path)
                    print(f"Excel zip found: {f} (size: {os.path.getsize(full_path)}, mtime: {mtime})")
                    try:
                        wb = openpyxl.load_workbook(full_path, data_only=True, read_only=True)
                        print(f"   Sheets: {wb.sheetnames}")
                    except Exception as e:
                        print(f"   Could not load workbook: {e}")
        except Exception:
            pass
