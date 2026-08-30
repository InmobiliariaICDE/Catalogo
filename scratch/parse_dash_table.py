from bs4 import BeautifulSoup
import re

with open('ADMINISTRACION/dashboard_inmobiliario.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Extract all table rows from dashboard_inmobiliario.html
matches = re.findall(r'<tr>(.*?)</tr>', html, re.DOTALL)
print(f"Total <tr> elements: {len(matches)}")
for m in matches:
    row_clean = re.sub(r'<.*?>', ' | ', m).strip()
    row_clean = " ".join(row_clean.split())
    if any(p in row_clean.lower() for p in ['apto', 'casa', 'local', 'limonar', 'lilola', 'goya', 'habitacion', 'silvia', 'marcos']):
        print("Dash Row:", row_clean)
