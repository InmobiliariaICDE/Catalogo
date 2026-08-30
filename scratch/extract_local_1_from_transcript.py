import os, json, re

log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\4af7f85e-94bb-49f2-822c-3757059125fd\.system_generated\logs\transcript_full.jsonl"

with open(log_path, encoding='utf-8', errors='ignore') as f:
    for line_num, line in enumerate(f):
        if 'LOCAL 1' in line:
            # Look for property object string
            pos = line.find('LOCAL 1')
            while pos != -1:
                start = line.rfind('{', 0, pos)
                end = line.find('}', pos)
                print(f"Match around pos {pos}:")
                print(line[max(0, start-50):min(len(line), end+100)])
                print("="*60)
                pos = line.find('LOCAL 1', pos + 1)
