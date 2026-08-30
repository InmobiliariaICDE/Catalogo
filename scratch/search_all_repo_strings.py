import os
import re

print("=== SEARCHING ALL FILES IN WORKSPACE FOR ANY TENANT / INQUILINO REFERENCES ===")

keywords = ['inquilino', 'arrendatario', 'elsa oviedo', 'canon', 'arriendo']
exclude_dirs = ['.git', 'node_modules', '.gemini']

found_files = {}

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file.endswith('.py') or file.endswith('.json') or file.endswith('.html') or file.endswith('.js') or file.endswith('.txt') or file.endswith('.csv') or file.endswith('.md'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    for kw in keywords:
                        if kw in content.lower():
                            if filepath not in found_files:
                                found_files[filepath] = []
                            found_files[filepath].append(kw)
            except Exception as e:
                pass

print(f"Found {len(found_files)} files containing keywords:")
for path, kws in found_files.items():
    print(f"  File: {path} -> Keywords: {set(kws)}")
