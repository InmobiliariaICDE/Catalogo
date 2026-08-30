import json
import os

print("=== CHECKING leads.json FOR LEASED / TENANT CLIENTS ===")
if os.path.exists('leads.json'):
    try:
        with open('leads.json', 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            if content.strip():
                leads = json.loads(content)
                print(f"Total leads: {len(leads)}")
                for l in list(leads)[:20]:
                    if isinstance(l, dict):
                        print("Lead:", l.get('nombre'), "| Prop:", l.get('inmueble'), "| Notas:", str(l.get('notas'))[:60])
    except Exception as e:
        print("Error reading leads.json:", e)

print("\n=== CHECKING citas.json ===")
if os.path.exists('citas.json'):
    try:
        with open('citas.json', 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            if content.strip():
                citas = json.loads(content)
                print(f"Total citas: {len(citas)}")
                for c in list(citas)[:20]:
                    if isinstance(c, dict):
                        print("Cita:", c.get('cliente'), "| Prop:", c.get('inmueble'))
    except Exception as e:
        print("Error reading citas.json:", e)
