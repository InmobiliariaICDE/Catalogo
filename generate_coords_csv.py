import json
import urllib.request
import csv

# Google Apps Script Web App URL
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-HipJ53KIf2JD1q9BUIBFUB45o4wRYcjvlqUbpg9TDAGK0q3hNQcSrV23dMCWaTgXcQ/exec"

def normalize_code(code):
    if code is None:
        return ""
    code_str = str(code).strip().lower()
    # Remove decimal points if they end with .0
    if code_str.endswith(".0"):
        code_str = code_str[:-2]
    # Remove leading zeros
    code_str = code_str.lstrip("0")
    return code_str

def main():
    print("Step 1: Loading properties from KMZ...")
    try:
        with open("propiedades_kmz.json", "r", encoding="utf-8") as f:
            kmz_props = json.load(f)
    except Exception as e:
        print(f"Error loading propiedades_kmz.json: {e}")
        return

    # Build code -> (lat, lng) mapping
    kmz_map = {}
    for kp in kmz_props:
        code = normalize_code(kp.get("Código"))
        lat = kp.get("Latitud")
        lng = kp.get("Longitud")
        if code and lat and lng:
            kmz_map[code] = (lat, lng)
    
    print(f"Found {len(kmz_map)} properties with coordinates in KMZ.")

    print("\nStep 2: Fetching live catalog properties in correct row order...")
    catalog_props = []
    try:
        req_url = f"{APPS_SCRIPT_URL}?action=getData"
        with urllib.request.urlopen(req_url, timeout=15) as response:
            catalog_props = json.loads(response.read().decode("utf-8"))
        print(f"Loaded {len(catalog_props)} live catalog properties in order.")
    except Exception as e:
        print(f"Error fetching live data: {e}. Trying local backup admin_data.json...")
        try:
            with open("admin_data.json", "r", encoding="utf-8") as f:
                local_data = json.load(f)
                if isinstance(local_data, dict):
                    catalog_props = local_data.get("remoteProps", []) + local_data.get("customProps", [])
                elif isinstance(local_data, list):
                    catalog_props = local_data
            print(f"Loaded {len(catalog_props)} from local backup.")
        except Exception as e_local:
            print(f"Error: {e_local}")
            return

    print("\nStep 3: Aligning coordinates with rows...")
    output_rows = []
    matched_count = 0

    for i, p in enumerate(catalog_props):
        raw_code = p.get("Código")
        code = normalize_code(raw_code)
        
        lat_val = ""
        lng_val = ""
        
        if code in kmz_map:
            lat, lng = kmz_map[code]
            # Formatear números con comas si es necesario, pero para Excel en español
            # un archivo CSV delimitado por punto y coma (;) con puntos decimales se lee de maravilla.
            # O mejor aún: reemplazamos el punto decimal por coma decimal para que Excel en español
            # lo reconozca nativamente como número sin alterar nada!
            # Ej: 2.9462453 -> "2,9462453"
            lat_val = str(lat).replace(".", ",")
            lng_val = str(lng).replace(".", ",")
            matched_count += 1
            
        output_rows.append({
            "Fila": i + 2, # Fila 2 en Excel es índice 0
            "Código": raw_code,
            "LATITUD": lat_val,
            "LONGITUD": lng_val
        })

    print(f"Aligned successfully. Matched {matched_count} properties with coordinates.")

    print("\nStep 4: Writing to coordenadas_inmuebles.csv...")
    csv_file = "coordenadas_inmuebles.csv"
    try:
        with open(csv_file, "w", newline="", encoding="utf-8-sig") as f:
            # delimiter=";" is highly optimized for Spanish Excel!
            writer = csv.DictWriter(f, fieldnames=["Fila", "Código", "LATITUD", "LONGITUD"], delimiter=";")
            writer.writeheader()
            writer.writerows(output_rows)
        print(f"🎉 CSV created: {csv_file}")
        print("You can open this CSV in Excel, copy the LATITUD and LONGITUD columns, and paste them directly into columns AM and AN of Google Sheets (from row 2).")
    except Exception as e:
        print(f"Error writing CSV: {e}")

if __name__ == "__main__":
    main()
