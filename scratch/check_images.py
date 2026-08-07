import urllib.request
import json

url = 'https://script.google.com/macros/s/AKfycbwH_gsvmcm3iTu1uYXjqNHOch_1d9B4inUxijX8RszlVxnaWK3VVhrbHdeQZVS0U72t/exec?tipo=infoBarrio&barrioName=Las%20Granjas'
req = urllib.request.urlopen(url)
data = req.read().decode('utf-8')
if data.startswith('handleInfoBarrio('):
    data = data[len('handleInfoBarrio('):-1]
obj = json.loads(data)
for item in obj.get('inmuebles', []):
    code = item.get('Codigo')
    pub = item.get('Publicar')
    img = item.get('Image')
    imgs = item.get('Imagenes')
    print(f"Codigo: {code} | Publicar: {pub} | Image: {img}")
