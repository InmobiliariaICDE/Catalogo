import json

log_path = r"C:\Users\USUARIO\.gemini\antigravity\brain\50bd21a7-2e7d-4e42-9369-3b784d447a56\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            content = str(obj.get('content', ''))
            tool_calls = str(obj.get('tool_calls', ''))
            
            # Check if it has the keyword and is a user input or a planner response (model text)
            if "AKfy" in content or "AKfy" in tool_calls:
                step_idx = obj.get('step_index')
                source = obj.get('source')
                type_ = obj.get('type')
                
                # If model or user input, let's print it or its tool calls
                if source == "MODEL" and type_ == "PLANNER_RESPONSE":
                    print(f"=== STEP {step_idx} (MODEL PLANNER_RESPONSE) ===")
                    print(content[:1000]) # first 1000 chars of text response
                    if obj.get('tool_calls'):
                        for tc in obj['tool_calls']:
                            if tc.get('name') in ['replace_file_content', 'write_to_file', 'multi_replace_file_content']:
                                print(f"Tool Call: {tc.get('name')}")
                                args = tc.get('arguments', {})
                                print(f"  TargetFile: {args.get('TargetFile')}")
                                if 'ReplacementChunks' in args:
                                    for rc in args['ReplacementChunks']:
                                        print(f"  Chunk target: {rc.get('TargetContent')[:200]}")
                                        print(f"  Chunk replacement: {rc.get('ReplacementContent')[:200]}")
                                elif 'ReplacementContent' in args:
                                    print(f"  TargetContent: {args.get('TargetContent')[:200]}")
                                    print(f"  ReplacementContent: {args.get('ReplacementContent')[:200]}")
                    print("="*60)
                elif source == "USER_EXPLICIT" and type_ == "USER_INPUT":
                    print(f"=== STEP {step_idx} (USER INPUT) ===")
                    print(content)
                    print("="*60)
        except Exception as e:
            pass
