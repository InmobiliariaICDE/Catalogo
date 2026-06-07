import json

log_path = r'C:\Users\USUARIO\.gemini\antigravity\brain\a9886933-4267-40ec-bff9-6fa22e7ba75b\.system_generated\logs\transcript.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for idx, line in enumerate(lines):
    try:
        data = json.loads(line)
        tool_calls = data.get('tool_calls') or []
        for tc in tool_calls:
            name = tc.get('name')
            if name in ('replace_file_content', 'multi_replace_file_content'):
                args = tc.get('args', {})
                target = args.get('TargetFile')
                if 'admin.html' in str(target):
                    print(f"Line {idx} (Step {data.get('step_index')}): {name}")
                    print(f"  StartLine: {args.get('StartLine')}, EndLine: {args.get('EndLine')}")
                    print(f"  TargetContent:\n{args.get('TargetContent')}")
                    print(f"  ReplacementContent:\n{args.get('ReplacementContent')}")
                    print("-" * 50)
    except Exception as e:
        pass
