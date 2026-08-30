import json
import os

print("=== CHECKING CRM / CONTABILIDAD / DASHBOARD FOR PORTAL & NOGALES ===")

files_to_check = [
    'contabilidad_script.js',
    'crm_clean.html',
    'ADMINISTRACION/dashboard_inmobiliario.html',
    'admin.html',
    'admin_backup.html',
    'admin_corrupted.html',
    'crm_apps_script.js',
    'contabilidad_apps_script.js'
]

for filename in files_to_check:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            for kw in ['portal del campo', 'nogales', 'goya b-10', 'local 1', 'apto 203']:
                c = content.lower().count(kw)
                if c > 0:
                    print(f"{filename} -> Keyword '{kw}': {c} matches")
