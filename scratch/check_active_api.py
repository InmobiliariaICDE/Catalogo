import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbxki98uXR_fXbFCPynfzvQN5ibiwQY23zKpLkLKTL7A26GlipdC20oQTKOrUwAMeIJ2gw/exec?action=getData&t=1'
print("Fetching from:", url)
try:
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    r = urllib.request.urlopen(req, timeout=15)
    data = json.loads(r.read().decode())
    
    if isinstance(data, list) and len(data) > 0:
        print(f"Total de elementos: {len(data)}")
        
        # Filtrar los que tengan algún Dimensiones no vacío
        con_dim = [p for p in data if p.get('Dimensiones', '').strip() != '']
        print(f"Elementos con 'Dimensiones' no vacías: {len(con_dim)}")
        for p in con_dim[:15]:
            print(f"COD: {p.get('Código', p.get('id', '?'))} | Dim: '{p.get('Dimensiones')}' | Debug: '{p.get('Dimensiones_Debug')}'")
            
        print("\nMuestra de debug de los primeros 15 elementos generales:")
        for p in data[:15]:
            print(f"COD: {p.get('Código', p.get('id', '?'))} | Dim: '{p.get('Dimensiones')}' | Debug: '{p.get('Dimensiones_Debug')}'")
            
    else:
        print("No es array o vacío")
except Exception as e:
    print("Error:", e)
