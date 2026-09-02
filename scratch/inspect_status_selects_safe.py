import re

with open('admin.html', encoding='utf-8') as f:
    text = f.read()

matches = [m.start() for m in re.finditer(r'quickSaveAdminPaymentStatus|updatePayStatusFromTop|updatePayStatusFromBottom|editPayStatus|topPayStatusSelect', text)]
print(f"Total status select occurrences: {len(matches)}")

for i, pos in enumerate(matches):
    start = max(0, pos - 100)
    end = min(len(text), pos + 700)
    snippet = text[start:end]
    print(f"\n=================== STATUS SELECT #{i+1} at char {pos} ===================")
    for line in snippet.splitlines():
        if 'option' in line.lower() or 'select' in line.lower() or 'topPay' in line or 'editPay' in line:
            print(line.encode('ascii', 'replace').decode('ascii'))
