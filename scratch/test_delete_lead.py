import urllib.request
import json
import time

URL = 'https://script.google.com/macros/s/AKfycbzsal6Hog6hCW-87stJ6FrYY5tIucA4vTRHMcIT2rfkP_nwgT_NhOaXS5249RcK-x7dYw/exec'

test_lead = {
    'id': 'LEAD-TEST-DELETE-888',
    'nombre': 'Lead Prueba Eliminar',
    'celular': '3009998887',
    'tipo': 'comprador',
    'estado': 'activo'
}

print("1. Saving test lead...")
req = urllib.request.Request(URL, data=json.dumps({'action': 'saveLead', 'lead': json.dumps(test_lead)}).encode('utf-8'), headers={'Content-Type': 'text/plain'})
with urllib.request.urlopen(req) as resp:
    print("Save response:", resp.read().decode('utf-8'))

time.sleep(2)

print("\n2. Checking getLeads...")
with urllib.request.urlopen(URL + '?action=getLeads') as resp:
    data = json.loads(resp.read().decode('utf-8'))
    found = any(str(l.get('ID') or l.get('id')) == 'LEAD-TEST-DELETE-888' or '3009998887' in str(l.get('Celular') or l.get('celular')) for l in data)
    print("Found in cloud after save:", found)

print("\n3. Deleting test lead via GET deleteLead...")
with urllib.request.urlopen(URL + '?action=deleteLead&id=LEAD-TEST-DELETE-888&celular=3009998887') as resp:
    print("Delete response:", resp.read().decode('utf-8'))

time.sleep(2)

print("\n4. Checking getLeads after delete...")
with urllib.request.urlopen(URL + '?action=getLeads') as resp:
    data = json.loads(resp.read().decode('utf-8'))
    found = any(str(l.get('ID') or l.get('id')) == 'LEAD-TEST-DELETE-888' or '3009998887' in str(l.get('Celular') or l.get('celular')) for l in data)
    print("Found in cloud after delete:", found)
