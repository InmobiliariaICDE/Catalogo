with open('admin.html', encoding='utf-8') as f:
    text = f.read()

print("findAdminProperty in admin.html:", "findAdminProperty" in text)
