import json
import urllib.request
import urllib.error

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

    print("\nStep 2: Loading catalog properties...")
    catalog_props = []
    # Try fetching live data first
    try:
        req_url = f"{APPS_SCRIPT_URL}?action=getData"
        print(f"Fetching live catalog data from: {req_url}")
        with urllib.request.urlopen(req_url, timeout=15) as response:
            catalog_props = json.loads(response.read().decode("utf-8"))
        print(f"Loaded {len(catalog_props)} live catalog properties from Google Sheets.")
    except Exception as e:
        print(f"Could not fetch live catalog data ({e}). Falling back to local admin_data.json...")
        try:
            with open("admin_data.json", "r", encoding="utf-8") as f:
                local_data = json.load(f)
                # If local_data is dict and has customProps/remoteProps
                if isinstance(local_data, dict):
                    catalog_props = local_data.get("remoteProps", []) + local_data.get("customProps", [])
                elif isinstance(local_data, list):
                    catalog_props = local_data
            print(f"Loaded {len(catalog_props)} properties from local admin_data.json.")
        except Exception as e_local:
            print(f"Error loading local backup: {e_local}")
            return

    print("\nStep 3: Matching properties and preparing coordinates batch...")
    coords_to_sync = []
    matched_codes = set()

    for p in catalog_props:
        raw_code = p.get("Código")
        code = normalize_code(raw_code)
        if not code:
            continue
        
        if code in kmz_map:
            lat, lng = kmz_map[code]
            coords_to_sync.append({
                "codigo": str(raw_code),
                "lat": float(lat),
                "lng": float(lng)
            })
            matched_codes.add(code)

    print(f"Matched {len(coords_to_sync)} properties to update with coordinates.")

    if not coords_to_sync:
        print("No matching properties with coordinates found. Nothing to update.")
        return

    print("\nStep 4: Sending batch update to Google Apps Script...")
    payload = {
        "action": "batchSaveCoords",
        "coords": coords_to_sync
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        APPS_SCRIPT_URL,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_content = response.read().decode("utf-8")
            res_json = json.loads(res_content)
            print(f"Response from Apps Script: {json.dumps(res_json, indent=2)}")
            if res_json.get("success"):
                print(f"\n🎉 SUCCESS! Exported coordinates for {res_json.get('count')} properties into the LATITUD and LONGITUD columns.")
            else:
                print(f"\n❌ Error returned from Google Sheets Apps Script: {res_json.get('error')}")
    except Exception as e:
        print(f"Error sending batch update request: {e}")

if __name__ == "__main__":
    main()
