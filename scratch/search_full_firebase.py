with open('index.html', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'initializeapp' in line.lower() or 'firebase.app' in line.lower() or 'firestore' in line.lower():
            print(f"{i+1}: {line.strip()[:100]}")
