import urllib.request, json

url = 'https://script.google.com/macros/s/AKfycbz-HipJ53KIf2JD1q9BUIBFUB45o4wRYcjvlqUbpg9TDAGK0q3hNQcSrV23dMCWaTgXcQ/exec?action=getData&t=1'
try:
    r = urllib.request.urlopen(url, timeout=15)
    data = json.loads(r.read().decode())
    if isinstance(data, list) and len(data) > 0:
        keys = list(data[0].keys())
        print('COLUMNAS:', keys)
        for p in data[:5]:
            print('COD:', p.get('Codigo','?'), '| LAT:', repr(p.get('Latitud','MISSING')), '| LNG:', repr(p.get('Longitud','MISSING')))
    else:
        print('No es array o esta vacio:', type(data))
except Exception as e:
    print('Error:', e)
