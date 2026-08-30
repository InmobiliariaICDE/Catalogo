import json

log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\4af7f85e-94bb-49f2-822c-3757059125fd\.system_generated\logs\transcript.jsonl"

print("Reading 4af7f85e-94bb-49f2-822c-3757059125fd...")
with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        if any(k in line.lower() for k in ['tenant', 'inquilino', 'marcos', 'jorge luis', 'silvia', 'angela', 'nohora', 'eduard', 'giovany', 'nini']):
            for kw in ['tenant_name', 'inquilino']:
                if kw in line.lower():
                    print(f"Line {idx}: {line[:180]}")
