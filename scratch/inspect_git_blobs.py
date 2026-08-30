import zlib
import os
import json

obj_dir = r'c:\Users\USUARIO\Documents\GitHub\Catalogo\.git\objects'
found_jsons = []

for root, dirs, files in os.walk(obj_dir):
    for file in files:
        if len(file) == 38:
            sha = os.path.basename(root) + file
            path = os.path.join(root, file)
            try:
                with open(path, 'rb') as f:
                    data = zlib.decompress(f.read())
                b_null = data.find(b'\x00')
                header = data[:b_null]
                if header.startswith(b'blob') and b'properties' in data:
                    body = data[b_null+1:]
                    if body.startswith(b'{') and b'properties' in body:
                        found_jsons.append((sha, len(body), body))
            except Exception:
                pass

print('Found JSON blobs:', len(found_jsons))
for sha, sz, body in found_jsons:
    try:
        j = json.loads(body.decode('utf-8'))
        props = j.get('properties', [])
        print(f"\nSHA: {sha[:8]} | Size: {sz} | Total Properties: {len(props)}")
        for p in props:
            p_name = p.get('name', '')
            if 'LOCAL 1' in p_name or '303' in p_name or 'LIMONAR' in p_name:
                p2026 = p.get('payments', {}).get('2026', [])
                valid_pays = [(m['month'], m['value']) for m in p2026 if m['value'] != '-' and m['value'] != '']
                print(f"  {p_name} (ID: {p.get('id')}): {valid_pays[:6]}")
    except Exception as e:
        print("  Parse error:", e)
