import xml.etree.ElementTree as ET
import json
import re
import os

def extract_code_price(name):
    # Pattern for [code]-✅$[price]-[name] or [code]-✅$[price]
    # Example: 539-✅$150mlls-CONJ. RES. BRISAS DEL MAGDALENA
    match = re.match(r'^(\d+)-✅\$([^-\s]+)(.*)', name)
    if match:
        code = match.group(1)
        price = match.group(2)
        full_name = match.group(3).strip('- ').strip()
        return code, price, full_name
    
    # Fallback for other patterns
    match = re.search(r'(\d{2,})', name)
    code = match.group(1) if match else ""
    return code, None, name

def parse_kml(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    namespace = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    propiedades = []
    
    # Find all Folders (categories)
    folders = root.findall('.//kml:Folder', namespace)
    for folder in folders:
        category = folder.find('kml:name', namespace).text
        placemarks = folder.findall('.//kml:Placemark', namespace)
        
        for pm in placemarks:
            name_el = pm.find('kml:name', namespace)
            name = name_el.text if name_el is not None else ""
            
            code, price, display_name = extract_code_price(name)
            
            # Coordinates
            coords_el = pm.find('.//kml:coordinates', namespace)
            coords = coords_el.text.strip().split(',') if coords_el is not None else [0, 0]
            lng = float(coords[0])
            lat = float(coords[1])
            
            # Extended Data
            data = {}
            extended_data = pm.find('kml:ExtendedData', namespace)
            if extended_data is not None:
                for d in extended_data.findall('kml:Data', namespace):
                    data_name = d.get('name').strip(': ')
                    data_val = d.find('kml:value', namespace).text
                    data[data_name] = data_val
            
            # Images
            images = []
            if 'gx_media_links' in data:
                images = data['gx_media_links'].split()
            
            # Fallback for description images if gx_media_links is empty
            desc_el = pm.find('kml:description', namespace)
            if desc_el is not None and desc_el.text and not images:
                img_matches = re.findall(r'src="([^"]+)"', desc_el.text)
                images = img_matches

            prop = {
                "Código": code,
                "Precio_KMZ": price,
                "Nombre_KMZ": display_name or name,
                "Categoría": category,
                "Latitud": lat,
                "Longitud": lng,
                "Imagenes": "|".join(images),
                "KMZ_Data": data
            }
            
            # Map specific fields for easier correlation
            if 'Habitaciones' in data: prop['Habitaciones'] = data['Habitaciones']
            if 'Baños' in data: prop['Baños'] = data['Baños']
            if 'Pisos' in data: prop['Pisos'] = data['Pisos']
            if 'Garaje' in data: prop['Garaje'] = data['Garaje']
            if 'Ubicación' in data: prop['Ubicación'] = data['Ubicación']
            if 'Área de lote' in data: prop['Área'] = data['Área de lote']
            
            propiedades.append(prop)
            
    return propiedades

if __name__ == "__main__":
    kml_path = "temp_full_kmz/doc.kml"
    if os.path.exists(kml_path):
        props = parse_kml(kml_path)
        with open("propiedades_kmz.json", "w", encoding="utf-8") as f:
            json.dump(props, f, ensure_ascii=False, indent=2)
        print(f"Procesadas {len(props)} propiedades y guardadas en propiedades_kmz.json")
    else:
        print(f"Error: No se encontró {kml_path}")
