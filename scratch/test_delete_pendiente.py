import urllib.request
import json
import time

URL = 'https://script.google.com/macros/s/AKfycbzsal6Hog6hCW-87stJ6FrYY5tIucA4vTRHMcIT2rfkP_nwgT_NhOaXS5249RcK-x7dYw/exec'

test_task = {
    'id': 'TASK-TEST-DELETE-999',
    'texto': 'Tarea de prueba eliminacion',
    'area': 'ventas',
    'completada': False
}

print("1. Saving test task...")
req = urllib.request.Request(URL, data=json.dumps({'action': 'savePendiente', 'pendiente': json.dumps(test_task)}).encode('utf-8'), headers={'Content-Type': 'text/plain'})
with urllib.request.urlopen(req) as resp:
    print("Save response:", resp.read().decode('utf-8'))

time.sleep(2)

print("\n2. Checking getPendientes...")
with urllib.request.urlopen(URL + '?action=getPendientes') as resp:
    data = json.loads(resp.read().decode('utf-8'))
    found = any(p.get('id') == 'TASK-TEST-DELETE-999' for p in data)
    print("Found in cloud after save:", found)

print("\n3. Deleting test task...")
req = urllib.request.Request(URL, data=json.dumps({'action': 'deletePendiente', 'id': 'TASK-TEST-DELETE-999'}).encode('utf-8'), headers={'Content-Type': 'text/plain'})
with urllib.request.urlopen(req) as resp:
    print("Delete response:", resp.read().decode('utf-8'))

time.sleep(2)

print("\n4. Checking getPendientes after delete...")
with urllib.request.urlopen(URL + '?action=getPendientes') as resp:
    data = json.loads(resp.read().decode('utf-8'))
    found = any(p.get('id') == 'TASK-TEST-DELETE-999' for p in data)
    print("Found in cloud after delete:", found)
