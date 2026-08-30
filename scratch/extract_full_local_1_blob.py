import os, zlib, json

git_objects_dir = ".git/objects"
if not os.path.exists(git_objects_dir):
    git_objects_dir = r"C:\Users\USUARIO\.gemini\antigravity\brain\4af7f85e-94bb-49f2-822c-3757059125fd\.git\objects"

local_1_prop = None

for root, dirs, files in os.walk(git_objects_dir):
    for f in files:
        if len(f) == 38:
            path = os.path.join(root, f)
            try:
                with open(path, "rb") as gf:
                    data = zlib.decompress(gf.read())
                    if b"LOCAL 1" in data:
                        text = data.decode("utf-8", errors="ignore")
                        if '"properties"' in text:
                            d = json.loads(text[text.find('{'):])
                            for p in d.get('properties', []):
                                if 'LOCAL 1' in p.get('name', '').upper():
                                    local_1_prop = p
                                    break
                        if local_1_prop: break
            except Exception: pass
    if local_1_prop: break

if local_1_prop:
    print("SUCCESSFULLY EXTRACTED LOCAL 1 PROPERTY OBJECT:")
    print(json.dumps(local_1_prop, indent=2, ensure_ascii=False))
    with open("recovered_local_1.json", "w", encoding="utf-8") as out:
        json.dump(local_1_prop, out, indent=2, ensure_ascii=False)
    print("\nSaved to recovered_local_1.json!")
else:
    print("Could not extract property JSON object.")
