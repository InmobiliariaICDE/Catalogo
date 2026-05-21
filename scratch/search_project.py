import os
files = [f for f in os.listdir('.') if f.endswith('.html') or f.endswith('.js')]
for f in files:
    try:
        with open(f, encoding='utf-8') as file:
            content = file.read()
            if 'firebase' in content.lower() or 'firestore' in content.lower():
                print(f"Match in {f}")
    except Exception as e:
        pass
