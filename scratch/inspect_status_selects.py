import re

with open('admin.html', encoding='utf-8') as f:
    text = f.read()

# Find all occurrences of select dropdowns related to payment status
matches = [m.start() for m in re.finditer(r'quickSaveAdminPaymentStatus|updatePayStatusFromTop|updatePayStatusFromBottom|editPayStatus|topPayStatusSelect', text)]
print(f"Total status select occurrences: {len(matches)}")

for i, pos in enumerate(matches):
    start = max(0, pos - 150)
    end = min(len(text), pos + 600)
    print(f"\n=================== STATUS SELECT #{i+1} at char {pos} ===================")
    print(text[start:end])
