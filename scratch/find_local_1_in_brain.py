import os, json

brain_dir = r"C:\Users\USUARIO\.gemini\antigravity\brain\4af7f85e-94bb-49f2-822c-3757059125fd"

found = False
for root, dirs, files in os.walk(brain_dir):
    for fname in files:
        if fname.endswith(('.json', '.log', '.jsonl', '.py', '.txt')):
            path = os.path.join(root, fname)
            try:
                with open(path, encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if 'LOCAL 1' in content.upper():
                    print(f"Found 'LOCAL 1' in {path}")
                    # Try to extract the property JSON object
                    idx = content.find('"LOCAL 1')
                    if idx != -1:
                        start_obj = content.rfind('{', 0, idx)
                        end_obj = content.find('}', idx)
                        print("Snippet:", content[max(0, start_obj-50):min(len(content), end_obj+50)])
            except Exception as e:
                pass
