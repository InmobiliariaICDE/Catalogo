with open('admin.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

target = "let cellContent = '·';"

replacement = """// Si es el mes de renovación y no está pagado o desocupado, marcar como NEW_CONTRACT para mostrar la estrella de renovación
                  if (isRenovMonth && (pay.status === 'PENDING' || pay.status === 'FUTURE' || pay.status === 'UNSTARTED')) {
                    pay = { ...pay, status: 'NEW_CONTRACT' };
                  }
                  let cellContent = '·';"""

assert target in content, "Target not found in admin.html"
content = content.replace(target, replacement, 1)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Added auto renewal icon logic to admin.html!")
