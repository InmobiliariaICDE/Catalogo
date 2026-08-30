import glob
import json
import os

print("=== SEARCHING ALL PAST CONVERSATION LOGS FOR TENANT NAMES ===")
logs = glob.glob(r"C:\Users\USUARIO\.gemini\antigravity\brain\*\.system_generated\logs\transcript.jsonl")

found_in_conversations = []
for logpath in logs:
    conv_id = logpath.split(os.sep)[6]
    print(f"\n--- Reading Conv ID: {conv_id} ---")
    try:
        with open(logpath, 'r', encoding='utf-8', errors='ignore') as f:
            for line_idx, line in enumerate(f):
                if any(k in line.lower() for k in ['tenant_name', 'inquilino', 'arrendatario', 'elsa oviedo']):
                    for kw in ['tenant_name', 'inquilino']:
                        if kw in line.lower():
                            found_in_conversations.append((conv_id, line_idx, line[:200]))
    except Exception as e:
        print("Error reading log:", e)

print(f"\nTotal matches in past conversation logs: {len(found_in_conversations)}")
for item in found_in_conversations[:30]:
    print(f"Conv {item[0]} Line {item[1]}: {item[2]}")
