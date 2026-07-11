file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the rent increase calculation logic
old_calc = """              // IPC de Colombia para 2025 certificado por el DANE: 5.10%
              const ipcRate = 0.051; 
              const incrementoVal = Math.round(rentNum * ipcRate);
              const nuevoArriendoVal = rentNum + incrementoVal;"""

new_calc = """              // IPC de Colombia para 2025 certificado por el DANE: 5.10%
              const ipcRate = 0.051; 
              const rawIncremento = Math.round(rentNum * ipcRate);
              let nuevoArriendoVal = rentNum + rawIncremento;
              // Redondear siempre a favor del arrendatario (al menor múltiplo de 10.000)
              nuevoArriendoVal = Math.floor(nuevoArriendoVal / 10000) * 10000;
              const incrementoVal = nuevoArriendoVal - rentNum;"""

content = content.replace(old_calc, new_calc)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
