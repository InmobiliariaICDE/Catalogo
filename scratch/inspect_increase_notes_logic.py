import re

with open('admin.html', encoding='utf-8') as f:
    html_content = f.read()

# Search for openMatrixCellDetails, increase_notes, and monthly_rent handling
matches = [m.start() for m in re.finditer(r'openMatrixCellDetails', html_content)]
print(f"openMatrixCellDetails occurrences: {len(matches)}")

for idx in matches:
    start = max(0, idx - 100)
    end = min(len(html_content), idx + 800)
    print("--- MATCH ---")
    print(html_content[start:end][:400])
