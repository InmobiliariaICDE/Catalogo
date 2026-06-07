import json

log_path = r'C:\Users\USUARIO\.gemini\antigravity\brain\a9886933-4267-40ec-bff9-6fa22e7ba75b\.system_generated\logs\transcript.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    try:
        data = json.loads(line)
        content = data.get('content') or ''
        if any(w in content.lower() for w in ('sombreada', 'sombrear', 'sombreado', 'selecciona', 'selecciones', 'administracion', 'leads')):
            print(f"Step {data.get('step_index')} ({data.get('source')}):")
            print(content[:500])
            print("=" * 60)
    except Exception:
        pass
