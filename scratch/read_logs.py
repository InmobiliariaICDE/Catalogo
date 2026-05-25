import os
import json

log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\50bd21a7-2e7d-4e42-9369-3b784d447a56\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print(f"Log path does not exist: {log_path}")
    # Let's list the parent directory to find what actually exists
    parent = os.path.dirname(log_path)
    if os.path.exists(parent):
        print(f"Contents of parent {parent}: {os.listdir(parent)}")
    else:
        grandparent = os.path.dirname(parent)
        if os.path.exists(grandparent):
            print(f"Contents of grandparent {grandparent}: {os.listdir(grandparent)}")
        else:
            print("Grandparent does not exist")
else:
    print("Log file found. Searching for Apps Script/CRM URLs...")
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            if "AKfy" in line:
                try:
                    obj = json.loads(line)
                    # print some context
                    print(f"Step {obj.get('step_index')}: {obj.get('type')}")
                    content = str(obj.get('content', ''))
                    tool_calls = str(obj.get('tool_calls', ''))
                    for term in ["AKfycb", "CRM_SCRIPT_URL", "script.google.com"]:
                        if term in content:
                            print(f"  Found in content: {term}")
                        if term in tool_calls:
                            print(f"  Found in tool_calls: {term}")
                except Exception as e:
                    pass
