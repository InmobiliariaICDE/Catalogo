import urllib.request

url = 'https://script.google.com/macros/s/AKfycbxki98uXR_fXbFCPynfzvQN5ibiwQY23zKpLkLKTL7A26GlipdC20oQTKOrUwAMeIJ2gw/exec?action=getData&t=1'
print("Requesting:", url)
try:
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    r = urllib.request.urlopen(req, timeout=15)
    print("Status:", r.status)
    print("Headers:", dict(r.headers))
    body = r.read()
    print("Body length:", len(body))
    print("Body preview:", body[:500])
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.reason)
    print("HTTP Headers:", dict(e.headers))
    try:
        print("HTTP Body:", e.read().decode())
    except:
        pass
except Exception as e:
    print("Generic Error:", e)
