with open('../admin.html', 'rb') as f:
    content = f.read()

# Let's find generating function code
lines = content.split(b'\n')
for idx, line in enumerate(lines):
    if b'generarSlugPropiedad' in line:
        for i in range(idx, idx+8):
            print(f"{i+1}: {lines[i]}")
