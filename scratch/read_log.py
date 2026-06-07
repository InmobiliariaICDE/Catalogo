import json

log_path = r'C:\Users\USUARIO\.gemini\antigravity\brain\a9886933-4267-40ec-bff9-6fa22e7ba75b\.system_generated\logs\transcript.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for line in lines[-25:]:
    try:
        data = json.loads(line)
        print(f"Step {data.get('step_index')}: {data.get('type')} - {data.get('source')} - {data.get('status')}")
        if data.get('tool_calls'):
            for tc in data['tool_calls']:
                print(f"  Tool Call: {tc['name']}")
                if tc['name'] in ('replace_file_content', 'multi_replace_file_content', 'write_to_file'):
                    # print args summary
                    args = tc.get('args', {})
                    target = args.get('TargetFile') or args.get('TargetFile')
                    print(f"    Target: {target}")
                    print(f"    Instruction: {args.get('Instruction')}")
                    print(f"    Description: {args.get('Description')}")
    except Exception as e:
        print(f"Error parsing line: {e}")
