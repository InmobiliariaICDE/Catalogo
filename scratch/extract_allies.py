import sys, os, json, re

sys.stdout.reconfigure(encoding='utf-8')

# 1. Read LW_PARTNERS from admin.html
allies = {}

with open('admin.html', 'r', encoding='utf-8', errors='replace') as f:
    html = f.read()

# Find LW_PARTNERS array
lw_matches = re.findall(r'nombre:\s*"([^"]+)"', html)
for nom in lw_matches:
    nom_clean = nom.strip()
    if nom_clean not in allies:
        allies[nom_clean] = set()

# Scan all files for Inmobiliaria + Celular pairs in any text or JSON structures
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root: continue
    for file in files:
        if file.endswith(('.json', '.js', '.html', '.txt', '.py')):
            fpath = os.path.join(root, file)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                    txt = f.read()
                    
                    # Match pattern like Jovel 3103914892 or Jovel - 3103914892
                    phone_matches = re.findall(r'(Jovel|C&C|Rocha|Soluciones La Primavera|JP Escobar|Menber|Rustik House|Elite Group|Santa Maria Vera|Santa María Vera|MAC|Yatrana|Tu Juridica|Casa Honor|Rediis|Casa & Casa)[^\n\r\d]*?([35]\d{9})', txt, re.IGNORECASE)
                    for inmob, num in phone_matches:
                        inm_norm = inmob.strip()
                        if inm_norm not in allies:
                            allies[inm_norm] = set()
                        allies[inm_norm].add(num.strip())
            except Exception as e:
                pass

print(f"Total allies found: {len(allies)}")
for ally, phones in sorted(allies.items()):
    p_str = ", ".join(sorted(phones)) if phones else "(Sin teléfono registrado en archivos locales)"
    print(f"- {ally}: {p_str}")
