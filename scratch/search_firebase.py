with open('admin.html', encoding='utf-8') as f:
    with open('scratch/fetch_search.txt', 'w', encoding='utf-8') as out:
        for i, line in enumerate(f):
            if 'fetch(' in line or 'db' in line or 'firestore' in line or 'firebase' in line:
                out.write(f"{i+1}: {line.strip()}\n")
print("Done searching.")
