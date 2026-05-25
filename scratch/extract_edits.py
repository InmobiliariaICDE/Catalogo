import json
import os

log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\50bd21a7-2e7d-4e42-9369-3b784d447a56\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            tool_calls = obj.get('tool_calls', [])
            if not tool_calls:
                continue
            for tc in tool_calls:
                name = tc.get('name')
                if name in ['replace_file_content', 'write_to_file', 'multi_replace_file_content']:
                    args = tc.get('args', {}) # sometimes 'args', sometimes 'arguments'
                    if not args:
                        args = tc.get('arguments', {})
                    target_file = args.get('TargetFile')
                    if target_file and ('admin.html' in target_file or 'crm_clean' in target_file or 'temp_script' in target_file):
                        print(f"Step {obj.get('step_index')}: {name} on {os.path.basename(target_file)}")
                        print(f"  Description: {args.get('Description')}")
                        print(f"  Instruction: {args.get('Instruction')}")
                        if name == 'replace_file_content':
                            target = args.get('TargetContent', '')
                            rep = args.get('ReplacementContent', '')
                            if 'URL' in target or 'URL' in rep or 'AKfy' in target or 'AKfy' in rep:
                                print("  -- Target Content snippet:")
                                print(f"    {target[:300]}")
                                print("  -- Replacement Content snippet:")
                                print(f"    {rep[:300]}")
                        elif name == 'multi_replace_file_content':
                            chunks = args.get('ReplacementChunks', [])
                            for chunk in chunks:
                                target = chunk.get('TargetContent', '')
                                rep = chunk.get('ReplacementContent', '')
                                if 'URL' in target or 'URL' in rep or 'AKfy' in target or 'AKfy' in rep:
                                    print("  -- Chunk Target Content snippet:")
                                    print(f"    {target[:300]}")
                                    print("  -- Chunk Replacement Content snippet:")
                                    print(f"    {rep[:300]}")
                        print("-" * 50)
        except Exception as e:
            pass
