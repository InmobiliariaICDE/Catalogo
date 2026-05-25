import json

log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\50bd21a7-2e7d-4e42-9369-3b784d447a56\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i < 3:
            obj = json.loads(line)
            print(f"Line {i}: keys = {list(obj.keys())}")
            print(f"  type = {obj.get('type')}")
            print(f"  source = {obj.get('source')}")
            # print first 200 chars of each value
            for k, v in obj.items():
                print(f"    {k}: {str(v)[:200]}")
            print("-" * 60)
        else:
            break
