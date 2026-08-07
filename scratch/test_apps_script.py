import urllib.request, urllib.parse, json

ADMIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAUUSYRhDX6Eik4KA-B6luk74YjCNRanwv13CmmZg4La8NzVuNyBC0T5GH6f4-ke-Xig/exec'

print("1. Testing GET getAdminData...")
try:
    req = urllib.request.Request(ADMIN_SCRIPT_URL + '?action=getAdminData&t=' + str(int(urllib.parse.quote('123'))))
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        data = json.loads(html)
        print("GET Success! Properties count:", len(data.get('properties', [])))
        if 'error' in data:
            print("GET returned error:", data['error'])
except Exception as e:
    print("GET Failed:", e)

print("\n2. Testing POST saveAdminPayment (dummy query)...")
try:
    payload = json.dumps({
        'action': 'saveAdminPayment',
        'propertyId': '999999',
        'propertyName': 'Test Prop',
        'year': '2026',
        'monthIndex': 7,
        'value': '-'
    }).encode('utf-8')
    
    req = urllib.request.Request(ADMIN_SCRIPT_URL, data=payload, headers={'Content-Type': 'text/plain'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print("POST Response:", html)
except Exception as e:
    print("POST Failed:", e)
