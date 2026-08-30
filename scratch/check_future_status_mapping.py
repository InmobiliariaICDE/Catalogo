import glob

for fname in ['admin.html', 'nuevo_admin_apps_script.js']:
    with open(fname, encoding='utf-8') as f:
        lines = f.readlines()
    print(f"=== {fname} ===")
    for i, l in enumerate(lines):
        if any(k in l for k in ['FUTURE', 'Futuro', 'AL_DIA', 'saveAdminPayment']):
            print(f"L{i+1}: {l.strip()[:100]}")
