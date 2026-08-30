import json, re

log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\4af7f85e-94bb-49f2-822c-3757059125fd\.system_generated\logs\transcript_full.jsonl"

with open(log_path, encoding='utf-8', errors='ignore') as f:
    for line_num, line in enumerate(f):
        if 'LOCAL 1' in line:
            pos = 0
            while True:
                idx = line.find('LOCAL 1', pos)
                if idx == -1: break
                pos = idx + 7
                # Print around idx
                snippet = line[max(0, idx-300):min(len(line), idx+500)]
                if 'monthly_rent' in snippet or 'due_day' in snippet or 'payments' in snippet or 'owner' in snippet:
                    print(f"Line {line_num} snippet:")
                    print(snippet)
                    print("="*80)
