with open('index.html', encoding='utf-8') as f:
    with open('scratch/firebase_index.txt', 'w', encoding='utf-8') as out:
        for i, line in enumerate(f):
            lower = line.lower()
            if 'firebase' in lower or 'firestore' in lower or 'initializeapp' in lower:
                out.write(f"{i+1}: {line.strip()}\n")
print("Done searching.")
