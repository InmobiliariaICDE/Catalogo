import os
import sys
import ctypes
from ctypes import wintypes
import zipfile
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

GENERIC_READ = 0x80000000
FILE_SHARE_READ = 0x00000001
FILE_SHARE_WRITE = 0x00000002
FILE_SHARE_DELETE = 0x00000004
OPEN_EXISTING = 3
FILE_ATTRIBUTE_NORMAL = 0x80

def read_locked_file(path):
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.CreateFileW(
        path,
        GENERIC_READ,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        None,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        None
    )
    if handle == -1 or handle == 0xFFFFFFFF:
        err = kernel32.GetLastError()
        print(f"CreateFileW failed for {path} with error: {err}")
        return None
    
    # Get file size
    size_high = wintypes.DWORD()
    size_low = kernel32.GetFileSize(handle, ctypes.byref(size_high))
    total_size = (size_high.value << 32) + size_low
    
    buf = ctypes.create_string_buffer(total_size)
    bytes_read = wintypes.DWORD()
    res = kernel32.ReadFile(handle, buf, total_size, ctypes.byref(bytes_read), None)
    kernel32.CloseHandle(handle)
    
    if res:
        return buf.raw[:bytes_read.value]
    return None

tmps = [
    r"C:\Users\USUARIO\AppData\Local\Temp\61baf655-3f29-4bf8-9281-fafd4d7c291f.tmp",
    r"C:\Users\USUARIO\AppData\Local\Temp\623ff4f1-a8b8-4499-b894-e31244902a5f.tmp",
    r"C:\Users\USUARIO\AppData\Local\Temp\6ef2afa8-0713-460d-82ef-f0a450b543cf.tmp",
    r"C:\Users\USUARIO\AppData\Local\Temp\257cdbdd-3cc6-40b6-82b6-243ad4a262c9.tmp"
]

for idx, fp in enumerate(tmps):
    print(f"\nWin32 reading {idx}: {fp}")
    data = read_locked_file(fp)
    if data:
        out_name = f"scratch/win32_copy_{idx}.tmp"
        with open(out_name, 'wb') as out_f:
            out_f.write(data)
        print(f"Read {len(data)} bytes! Saved to {out_name}")
        header = data[:16]
        print("Header hex:", header.hex())
        if header.startswith(b'PK\x03\x04'):
            print("ZIP archive detected!")
            try:
                wb = openpyxl.load_workbook(out_name, data_only=True, read_only=True)
                print("Sheets in workbook:", wb.sheetnames)
            except Exception as e:
                print("Failed openpyxl load:", e)
