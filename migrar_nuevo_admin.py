import json
import os
import requests
import sys

def main():
    if len(sys.argv) < 2:
        print("Uso: python migrar_nuevo_admin.py <URL_DEL_NUEVO_APPS_SCRIPT_WEB_APP>")
        print("Ejemplo: python migrar_nuevo_admin.py https://script.google.com/macros/s/ABC...XYZ/exec")
        sys.exit(1)
        
    url = sys.argv[1]
    
    # 1. Leer el archivo local admin_data.json
    json_file = "admin_data.json"
    if not os.path.exists(json_file):
        print(f"Error: No se encontró el archivo '{json_file}' en el directorio actual.")
        sys.exit(1)
        
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    print(f"Cargadas {len(data.get('properties', []))} propiedades desde {json_file}.")
    
    # 2. Enviar por POST al nuevo Apps Script
    payload = {
        "action": "importAdminData",
        "data": data
    }
    
    print("Enviando datos a Google Sheets...")
    try:
        response = requests.post(
            url,
            headers={"Content-Type": "text/plain"},
            data=json.dumps(payload),
            timeout=30
        )
        
        if response.status_code == 200:
            res_data = response.json()
            if res_data.get("success"):
                print(f"Exito: Se migraron e importaron {res_data.get('count')} registros correctamente en Google Sheets.")
            else:
                print("Error devuelto por el script:", res_data.get("error"))
        else:
            print(f"Error de servidor: Codigo de estado {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print("Ocurrio una excepcion al hacer el POST:", str(e))

if __name__ == "__main__":
    main()
