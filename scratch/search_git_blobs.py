import os, zlib, json

# Search git objects in repository .git directory
git_objects_dir = ".git/objects"
if not os.path.exists(git_objects_dir):
    git_objects_dir = r"C:\Users\USUARIO\.gemini\antigravity\brain\4af7f85e-94bb-49f2-822c-3757059125fd\.git\objects"

print("Searching git objects dir:", git_objects_dir)

found_blobs = []

for root, dirs, files in os.walk(git_objects_dir):
    for f in files:
        if len(f) == 38: # hash suffix
            path = os.path.join(root, f)
            try:
                with open(path, "rb") as gf:
                    data = zlib.decompress(gf.read())
                    if b"LOCAL 1" in data or b"LOCAL 1 1" in data:
                        text = data.decode("utf-8", errors="ignore")
                        print(f"\nFound LOCAL 1 in git object {f} ({len(data)} bytes)!")
                        # Search for json object
                        if '"properties"' in text or '"monthly_rent"' in text or '"due_day"' in text:
                            print("This is a property/admin data blob!")
                            found_blobs.append(text)
            except Exception:
                pass

for i, text in enumerate(found_blobs):
    print(f"\n--- Blob {i+1} ---")
    pos = text.find("LOCAL 1")
    while pos != -1:
        start = text.rfind('{', 0, pos)
        end = text.find('}', pos)
        print(text[max(0, start-100):min(len(text), end+200)])
        print("="*60)
        pos = text.find("LOCAL 1", pos + 1)
