import json, os

log_path = r'C:\Users\USUARIO\.gemini\antigravity\brain\b97e1c5e-197d-46e6-99cb-dfc7c74acb3e\.system_generated\logs\transcript.jsonl'
if os.path.exists(log_path):
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                # Look for tool calls that replaced content in admin.html
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        if tc.get('name') in ['replace_file_content', 'multi_replace_file_content']:
                            print("TOOL CALL:", tc.get('name'))
                            print("Args instruction:", tc.get('args', {}).get('Instruction'))
                            print("Args TargetFile:", tc.get('args', {}).get('TargetFile'))
                            print("Replacement chunk snippet:", str(tc.get('args', {}).get('ReplacementContent'))[:200])
                            print("="*40)
            except Exception as e:
                pass
else:
    print("Log path not found:", log_path)
