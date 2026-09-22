import os
import sys
import shutil
import zipfile
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

tmps = [
    r"C:\Users\USUARIO\AppData\Local\Temp\61baf655-3f29-4bf8-9281-fafd4d7c291f.tmp",
    r"C:\Users\USUARIO\AppData\Local\Temp\623ff4f1-a8b8-4499-b894-e31244902a5f.tmp",
    r"C:\Users\USUARIO\AppData\Local\Temp\6ef2afa8-0713-460d-82ef-f0a450b543cf.tmp",
    r"C:\Users\USUARIO\AppData\Local\Temp\257cdbdd-3cc6-40b6-82b6-243ad4a262c9.tmp"
]

for idx, fp in enumerate(tmps):
    print(f"\nTesting {idx}: {fp}")
    if os.path.exists(fp):
        copy_path = f"scratch/temp_copy_{idx}.tmp"
        try:
            shutil.copyfile(fp, copy_path)
            print(f"Copied {os.path.getsize(copy_path)} bytes to {copy_path}")
            with open(copy_path, 'rb') as f:
                header = f.read(100)
                print("Magic bytes:", header[:16].hex())
                if header.startswith(b'PK\x03\x04'):
                    print("ZIP archive detected!")
                    try:
                        zf = zipfile.ZipFile(copy_path)
                        print("Zip files sample:", zf.namelist()[:10])
                        wb = openpyxl.load_workbook(copy_path, data_only=True, read_only=True)
                        print("Workbook sheets:", wb.sheetnames)
                    except Exception as e:
                        print("Could not load as openpyxl:", e)
        except Exception as e:
            print(f"Failed to copy/inspect: {e}")
