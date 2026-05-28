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
    target_codes = ['038', '352']
    for tc in target_codes:
        found = [p for p in data if StringMatch(p.get('Código', p.get('id', '')), tc)]
        if found:
            for p in found:
                print(f"COD: '{p.get('Código')}' | Publicar: '{p.get('Publicar')}'")
        else:
            print(f"No se encontró {tc}")
except Exception as e:
    print("Error:", e)
