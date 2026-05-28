import urllib.request, json

def StringMatch(val1, val2):
    return str(val1).strip().lower() == str(val2).strip().lower()

url = 'https://script.google.com/macros/s/AKfycbxki98uXR_fXbFCPynfzvQN5ibiwQY23zKpLkLKTL7A26GlipdC20oQTKOrUwAMeIJ2gw/exec?action=getData&t=1'
try:
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    r = urllib.request.urlopen(req, timeout=15)
    data = json.loads(r.read().decode())
    
    # Buscar por codigo
    target_codes = ['038', '38', '1376', '352']
    for tc in target_codes:
        found = [p for p in data if StringMatch(p.get('Código', p.get('id', '')), tc)]
        print(f"\n--- BUSCANDO CODIGO: '{tc}' ---")
        if found:
            for p in found:
                print(f"Código: '{p.get('Código')}'")
                print(f"Dimensiones: '{p.get('Dimensiones')}'")
                print(f"Dimensiones_Debug: '{p.get('Dimensiones_Debug')}'")
                print(f"Google Fotos: '{p.get('Google Fotos')}'")
                print(f"Keys present: {list(p.keys())}")
        else:
            print("No se encontró")
except Exception as e:
    print("Error:", e)
