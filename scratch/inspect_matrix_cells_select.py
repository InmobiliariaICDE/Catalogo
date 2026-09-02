with open('admin.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'renderMatrizPagos' in line or 'quickSaveAdminPaymentStatus' in line or 'status-cell' in line:
        print(f"Line {i+1}: {line.strip()}")
        # print next 20 lines
        for j in range(i+1, min(len(lines), i+25)):
            print(f"  Line {j+1}: {lines[j].strip()}")
        break
