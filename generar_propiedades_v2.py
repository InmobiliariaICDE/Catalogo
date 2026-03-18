#!/usr/bin/env python3
"""
generar_propiedades_v2.py
=========================
Lee TODAS las propiedades directamente desde el Apps Script de Google
y genera un archivo HTML por propiedad con:

  ✓ Diseño idéntico al modal del homepage
  ✓ Galería con miniaturas y lightbox
  ✓ Tabla de características (zona, estrato, área, piscina, etc.)
  ✓ Iconos de habitaciones, baños, garaje, pisos, cocina
  ✓ Secciones Puntos Clave y Descripción separadas
  ✓ SEO 100%: title, meta description, H1, Schema, Breadcrumb, OG
  ✓ Sin redirect — página autónoma e indexable
  ✓ Genera TODAS las propiedades del Sheet (incluidas las que faltan)
  ✓ Misma función generarSlug que el index.html
"""

import json
import re
import unicodedata
import urllib.request
import urllib.error
from pathlib import Path

# ──────────────────────────────────────────────
# CONFIGURACIÓN — ajusta solo estas variables
# ──────────────────────────────────────────────
APPS_SCRIPT_URL = (
    "https://script.google.com/macros/s/"
    "AKfycbz-HipJ53KIf2JD1q9BUIBFUB45o4wRYcjvlqUbpg9TDAGK0q3hNQcSrV23dMCWaTgXcQ"
    "/exec?action=getData"
)

BASE_URL    = "https://icdeinmobiliaria.com"
PHONE       = "573208762117"
PHONE_DISP  = "320 876 2117"
ADDRESS     = "Calle 32 #6-67, Las Granjas, Neiva, Huila"
LOGO_URL    = "https://i.imgur.com/XgfIulc.png"
FAVICON_URL = "https://i.imgur.com/4TfQXSf.png"
GTM_ID      = "GTM-PH2B85PT"

# Carpeta de salida — donde están los .html de propiedades
OUTPUT_DIR = Path(__file__).parent / "propiedad"

# ──────────────────────────────────────────────
# UTILIDADES
# ──────────────────────────────────────────────

def generar_slug(prop: dict) -> str:
    """Misma lógica que generarSlug() en el index.html"""
    nombre = str(prop.get("Nombre", ""))
    nombre = nombre.lower()
    # Normalizar acentos
    nombre = unicodedata.normalize("NFD", nombre)
    nombre = "".join(c for c in nombre if unicodedata.category(c) != "Mn")
    nombre = re.sub(r"\s+", "-", nombre)
    nombre = re.sub(r"[^a-z0-9-]", "", nombre)
    nombre = re.sub(r"-+", "-", nombre)
    nombre = nombre[:60]

    codigo = str(prop.get("Código", ""))
    codigo = re.sub(r"[^a-z0-9]", "", codigo.lower())

    if nombre:
        return nombre + "-" + codigo
    elif codigo:
        return "propiedad-" + codigo
    return ""


def parsear_imagenes(campo: str) -> list[str]:
    """Convierte el campo Imagenes (separado por |) en lista limpia."""
    if not campo:
        return []
    urls = [u.strip() for u in campo.replace("\r", "").replace("\n", "").split("|")]
    return [u for u in urls if len(u) > 10]


def precio_corto(precio_str: str) -> str:
    nums = re.sub(r"[^\d]", "", precio_str)
    if not nums:
        return precio_str
    val = int(nums)
    if val >= 1_000_000_000:
        mil = val // 1_000_000_000
        dec = (val % 1_000_000_000) // 100_000_000
        return f"${mil}.{dec}Mil M"
    if val >= 1_000_000:
        return f"${val // 1_000_000}M"
    return precio_str


def precio_numerico(precio_str: str) -> str:
    return re.sub(r"[^\d]", "", precio_str)


def esc(text: str) -> str:
    """Escapa comillas dobles para usar en atributos HTML."""
    return str(text).replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def esc_json(text: str) -> str:
    """Escapa para usar dentro de JSON en script ld+json."""
    return str(text).replace("\\", "\\\\").replace('"', '\\"')


# ──────────────────────────────────────────────
# DESCARGA DE DATOS
# ──────────────────────────────────────────────

def descargar_propiedades() -> list[dict]:
    print(f"📡 Descargando datos desde Apps Script...")
    try:
        req = urllib.request.Request(
            APPS_SCRIPT_URL,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        print(f"✅ {len(data)} propiedades descargadas")
        return data
    except urllib.error.URLError as e:
        print(f"❌ Error de conexión: {e}")
        print("   Verifica que tienes internet y que el Apps Script es público.")
        raise
    except json.JSONDecodeError as e:
        print(f"❌ Error al parsear JSON: {e}")
        raise


# ──────────────────────────────────────────────
# GENERADORES SEO
# ──────────────────────────────────────────────

def build_title(p: dict) -> str:
    tipo   = p.get("Tipo de inmueble") or "Propiedad"
    barrio = p.get("Barrio") or p.get("Ciudad") or "Neiva"
    zona   = barrio.split(",")[0].strip()
    precio = precio_corto(p.get("Precio", ""))
    hab    = p.get("Habitaciones", "")
    banos  = p.get("Baños", "")

    detalles = []
    if hab and hab != "0":
        detalles.append(f"{hab}hab")
    if banos and banos != "0":
        detalles.append(f"{banos}baños")
    if precio:
        detalles.append(precio)

    title = f"{tipo} en {zona}"
    if detalles:
        title += " – " + " · ".join(detalles)
    title += " | ICDE Neiva"

    if len(title) > 65:
        title = f"{tipo} en {zona} – {precio} | ICDE Neiva"
    if len(title) > 65:
        title = f"{tipo} en Neiva – {precio} | ICDE"
    return title


def build_meta_desc(p: dict) -> str:
    tipo   = p.get("Tipo de inmueble") or "Propiedad"
    barrio = (p.get("Barrio") or p.get("Ciudad") or "Neiva").split(",")[0].strip()
    precio = p.get("Precio", "")
    hab    = p.get("Habitaciones", "")
    banos  = p.get("Baños", "")
    area   = p.get("Área Construida", "")

    partes = [f"{tipo} en {barrio}, Neiva."]

    ficha = []
    if hab and hab != "0":
        ficha.append(f"{hab} habitaciones")
    if banos and banos != "0":
        ficha.append(f"{banos} baños")
    if area and area != "0":
        ficha.append(f"{area} m²")
    if precio:
        ficha.append(f"{precio} COP")
    if ficha:
        partes.append(", ".join(ficha) + ".")

    contenido = (p.get("Puntos Clave") or p.get("Descripción") or "").strip()
    if contenido:
        primera = contenido.split(".")[0].strip()
        if primera and len(primera) > 15:
            partes.append(primera[:80] + ".")

    partes.append("Contacta ICDE Inmobiliaria.")
    desc = " ".join(partes)
    if len(desc) > 155:
        desc = " ".join(partes[:2]) + " Contacta ICDE Inmobiliaria."
    if len(desc) > 155:
        desc = desc[:152] + "..."
    return desc


def build_h1(p: dict) -> str:
    tipo   = p.get("Tipo de inmueble") or "Propiedad"
    barrio = (p.get("Barrio") or p.get("Ciudad") or "Neiva").split(",")[0].strip()
    if "neiva" in barrio.lower():
        return f"{tipo} en Venta – {barrio}"
    return f"{tipo} en Venta – {barrio}, Neiva"


def build_schema(p: dict, slug: str, imagen: str) -> str:
    url_prop   = f"{BASE_URL}/propiedad/{slug}"
    nombre_esc = esc_json(p.get("Nombre") or p.get("Tipo de inmueble") or "Propiedad")
    desc_raw   = ((p.get("Descripción") or "") + " " + (p.get("Puntos Clave") or "")).strip()
    desc_esc   = esc_json(desc_raw[:500])
    localidad  = (p.get("Barrio") or p.get("Ciudad") or "Neiva").split(",")[0].strip()
    precio_num = precio_numerico(p.get("Precio", ""))

    hab   = p.get("Habitaciones", "")
    banos = p.get("Baños", "")
    area  = p.get("Área Construida", "")

    hab_line   = f'\n  "numberOfRooms": {hab},' if hab and hab != "0" else ""
    banos_line = f'\n  "numberOfBathroomsTotal": {banos},' if banos and banos != "0" else ""
    area_line  = f'\n  "floorSize": {{"@type":"QuantitativeValue","value":{area},"unitCode":"MTK"}},' if area and area != "0" else ""
    price_line = f'\n  "price": "{precio_num}",' if precio_num else ""
    img_line   = f'\n  "image": "{imagen}",' if imagen else ""

    return f'''{{{img_line}{hab_line}{banos_line}{area_line}{price_line}
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "{nombre_esc}",
  "description": "{desc_esc}",
  "url": "{url_prop}",
  "address": {{
    "@type": "PostalAddress",
    "streetAddress": "{esc_json(localidad)}",
    "addressLocality": "Neiva",
    "addressRegion": "Huila",
    "addressCountry": "CO"
  }},
  "offeredBy": {{
    "@type": "RealEstateAgent",
    "name": "ICDE Negocios Inmobiliarios",
    "url": "{BASE_URL}",
    "telephone": "+{PHONE}",
    "address": {{
      "@type": "PostalAddress",
      "streetAddress": "{ADDRESS}",
      "addressLocality": "Neiva",
      "addressRegion": "Huila",
      "addressCountry": "CO"
    }}
  }}
}}'''


def build_breadcrumb(p: dict, slug: str) -> str:
    tipo     = p.get("Tipo de inmueble") or "Propiedad"
    nombre_esc = esc_json(p.get("Nombre") or tipo)
    url_prop = f"{BASE_URL}/propiedad/{slug}"

    cat_map = {
        "apartamento": ("/", "Propiedades en Venta"),
        "casa campestre": ("/", "Propiedades en Venta"),
        "casa": ("/", "Propiedades en Venta"),
        "lote": ("/inversion-inmobiliaria-neiva", "Inversión Inmobiliaria"),
        "finca": ("/inversion-inmobiliaria-neiva", "Inversión Inmobiliaria"),
        "local": ("/inversion-inmobiliaria-neiva", "Inmuebles Comerciales"),
        "oficina": ("/inversion-inmobiliaria-neiva", "Inmuebles Comerciales"),
        "bodega": ("/inversion-inmobiliaria-neiva", "Inmuebles Comerciales"),
    }
    tipo_lower = tipo.lower()
    cat_url, cat_nombre = "/", "Propiedades"
    for k, v in cat_map.items():
        if k in tipo_lower:
            cat_url, cat_nombre = v
            break
    cat_url_full = BASE_URL + cat_url

    return f'''{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{"@type":"ListItem","position":1,"name":"ICDE Inmobiliaria","item":"{BASE_URL}"}},
    {{"@type":"ListItem","position":2,"name":"{esc_json(cat_nombre)}","item":"{cat_url_full}"}},
    {{"@type":"ListItem","position":3,"name":"{nombre_esc}","item":"{url_prop}"}}
  ]
}}'''


def internal_link(p: dict) -> tuple:
    tipo = (p.get("Tipo de inmueble") or "").lower()
    if "apartamento" in tipo:
        return "/", "Ver todos los apartamentos"
    if "casa campestre" in tipo:
        return "/", "Ver casas campestres"
    if "casa" in tipo:
        return "/", "Ver todas las casas"
    return "/", "Ver todas las propiedades"


# ──────────────────────────────────────────────
# ICONO SVG helpers
# ──────────────────────────────────────────────

ICONOS = {
    "hab":    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12V7a1 1 0 011-1h4a1 1 0 011 1v5M3 12h18M3 12v5h18v-5"/><path d="M13 6h4a1 1 0 011 1v5"/></svg>',
    "bano":   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16v4a4 4 0 01-4 4H8a4 4 0 01-4-4v-4z"/><path d="M6 12V5a2 2 0 012-2h1"/><circle cx="8" cy="3" r="1"/></svg>',
    "garaje": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M2 11h20M16 7l-1-4H9L8 7"/></svg>',
    "pisos":  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M3 7l9-4 9 4M4 11v10M20 11v10M8 11v10M16 11v10M12 11v10"/></svg>',
    "cocina": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M6 7V5a2 2 0 014 0v2M14 7V5a2 2 0 014 0v2"/><circle cx="8" cy="14" r="2"/><circle cx="16" cy="14" r="2"/></svg>',
    "lote":   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    "area":   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h4M4 4v4M20 4h-4M20 4v4M4 20h4M4 20v-4M20 20h-4M20 20v-4"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>',
    "wa":     '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
}


# ──────────────────────────────────────────────
# GENERADOR DE HTML
# ──────────────────────────────────────────────

def build_html(p: dict, slug: str) -> str:
    imagenes  = parsear_imagenes(p.get("Imagenes") or p.get("Google Fotos") or p.get("Image") or "")
    imagen_og = imagenes[0] if imagenes else ""

    title      = build_title(p)
    meta_desc  = build_meta_desc(p)
    h1_text    = build_h1(p)
    schema_p   = build_schema(p, slug, imagen_og)
    schema_bc  = build_breadcrumb(p, slug)
    url_prop   = f"{BASE_URL}/propiedad/{slug}"
    int_url, int_text = internal_link(p)

    nombre     = esc(p.get("Nombre") or p.get("Tipo de inmueble") or "Propiedad")
    tipo       = esc(p.get("Tipo de inmueble") or "Propiedad")
    precio_raw = p.get("Precio") or ""
    precio_num_str = re.sub(r"[^\d]", "", precio_raw)
    if precio_num_str:
        precio = "$" + "{:,}".format(int(precio_num_str)).replace(",", ".")
    else:
        precio = esc(precio_raw)
    barrio     = esc(p.get("Barrio") or "")
    zona_corta = (p.get("Barrio") or p.get("Ciudad") or "Neiva").split(",")[0].strip()
    alt_img    = esc(f"{p.get('Tipo de inmueble','Propiedad')} en venta {zona_corta} Neiva – ICDE Inmobiliaria")

    # ── GALERÍA ──
    galeria_html = ""
    miniaturas_html = ""
    if imagenes:
        galeria_html = f'<img id="imgPrincipal" src="{esc(imagenes[0])}" alt="{alt_img}" class="galeria-img" loading="eager" fetchpriority="high"/>'
        if len(imagenes) > 1:
            contador = f'<div class="img-contador"><span id="imgActual">1</span> / {len(imagenes)}</div>'
            nav = '<button class="galeria-nav prev" onclick="cambiarImg(-1)">&#8249;</button><button class="galeria-nav next" onclick="cambiarImg(1)">&#8250;</button>'
            expand = '<button class="galeria-expand" onclick="abrirLightbox(imgIndex)" title="Expandir">&#x26F6;</button>'
            miniaturas = "".join(
                f'<img src="{esc(u)}" alt="{alt_img} foto {i+1}" class="miniatura{" activa" if i==0 else ""}" onclick="irImg({i})" loading="lazy"/>'
                for i, u in enumerate(imagenes)
            )
            miniaturas_html = f'<div class="miniaturas-wrap"><div class="miniaturas">{miniaturas}</div></div>'
            galeria_html = f'{contador}{nav}{expand}{galeria_html}'
        else:
            galeria_html = f'<button class="galeria-expand" onclick="abrirLightbox(0)" title="Expandir">&#x26F6;</button>{galeria_html}'

    # ── CHIPS (iconos rápidos) ──
    chips = []
    campos_chip = [
        ("Habitaciones", ICONOS["hab"],    "hab."),
        ("Baños",        ICONOS["bano"],   "baños"),
        ("Garaje",       ICONOS["garaje"], "garaje"),
        ("Pisos",        ICONOS["pisos"],  "pisos"),
        ("Cocina",       ICONOS["cocina"], ""),
        ("Área lote",    ICONOS["lote"],   "m²"),
    ]
    for campo, ico, sufijo in campos_chip:
        val = p.get(campo, "").strip()
        if val and val not in ("0", "No aplica", "No tiene"):
            if campo == "Cocina":
                label = ("Cocina " + val).strip() if val.lower() not in ("si","sí","yes","1") else "Cocina integral"
            elif sufijo:
                label = f"{val} {sufijo}".strip()
            else:
                label = val
            chips.append(f'<span class="chip">{ico}{label}</span>')
    chips_html = f'<div class="chips">{"".join(chips)}</div>' if chips else ""

    # ── TABLA CARACTERÍSTICAS ──
    char_campos = [
        ("Ciudad",                p.get("Ciudad","")),
        ("Zona",                  p.get("Zona","")),
        ("Estrato",               p.get("Estrato","")),
        ("Ubicación",             p.get("Ubicación","")),
        ("Área construida",       p.get("Área Construida","")),
        ("Área lote",             p.get("Área lote","")),
        ("Piscina",               p.get("Piscina","")),
        ("Administración",        p.get("Administración","")),
        ("Retorno de la inversión", p.get("Retorno de la Inversión","")),
        ("Rentabilidad",          p.get("Rentabilidad","")),
    ]
    filas = ""
    for label, val in char_campos:
        v = str(val).strip()
        if v and v not in ("", "0"):
            filas += f'<tr><td class="char-label">{esc(label)}</td><td class="char-val">{esc(v)}</td></tr>'
    tabla_html = f'<div class="char-section"><h2 class="section-title">CARACTERÍSTICAS</h2><table class="char-table"><tbody>{filas}</tbody></table></div>' if filas else ""

    # ── PUNTOS CLAVE ──
    puntos = str(p.get("Puntos Clave") or "").strip()
    puntos_html = f'<div class="content-section"><h2 class="section-title">PUNTOS CLAVE</h2><p class="content-text">{esc(puntos)}</p></div>' if puntos else ""

    # ── DESCRIPCIÓN ──
    desc = str(p.get("Descripción") or "").strip()
    desc_html = f'<div class="content-section"><h2 class="section-title">DESCRIPCIÓN</h2><p class="content-text">{esc(desc)}</p></div>' if desc else ""

    # ── COMBINADO PUNTOS + DESCRIPCIÓN ──
    desc_puntos_combined = puntos_html + desc_html

    # ── WA TEXT ──
    from urllib.parse import quote as urlquote
    wa_text = urlquote(f"Hola, me interesa la propiedad: {p.get('Nombre','')} (Código {p.get('Código','')})")

    # ── JS IMÁGENES ──
    imgs_js = json.dumps(imagenes)

    return f"""<!DOCTYPE html>
<html lang="es-CO">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{esc(title)}</title>
<meta name="description" content="{esc(meta_desc)}"/>
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large"/>
<link rel="canonical" href="{url_prop}"/>
<link rel="alternate" hreflang="es-CO" href="{url_prop}"/>
<meta property="og:title" content="{esc(title)}"/>
<meta property="og:description" content="{esc(meta_desc)}"/>
<meta property="og:url" content="{url_prop}"/>
<meta property="og:type" content="website"/>
<meta property="og:locale" content="es_CO"/>
<meta property="og:site_name" content="ICDE Negocios Inmobiliarios"/>
{f'<meta property="og:image" content="{esc(imagen_og)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>' if imagen_og else ''}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{esc(title)}"/>
<meta name="twitter:description" content="{esc(meta_desc)}"/>
{f'<meta name="twitter:image" content="{esc(imagen_og)}"/>' if imagen_og else ''}
<script type="application/ld+json">{schema_p}</script>
<script type="application/ld+json">{schema_bc}</script>
<link rel="icon" type="image/png" href="{FAVICON_URL}"/>
<link rel="apple-touch-icon" href="{FAVICON_URL}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'"/>
<noscript><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet"/></noscript>
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);}})(window,document,'script','dataLayer','{GTM_ID}');</script>
<style>
:root{{
  --gold:#d4a84b;--gold-dim:rgba(212,168,75,.12);--gold-border:rgba(212,168,75,.25);
  --bg:#0a0a0a;--surface:#111;--surface2:#1a1a1f;
  --text:#e4e4e7;--text-muted:#a1a1aa;--text-faint:#52525b;
  --border:rgba(255,255,255,.07);--r:12px;
}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;line-height:1.7}}

.site-header{{background:rgba(10,10,10,.96);border-bottom:1px solid var(--border);padding:0 1.25rem;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:200;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}}
.site-header img{{height:34px;display:block}}
.back-btn{{display:flex;align-items:center;gap:6px;color:var(--text-muted);text-decoration:none;font-size:13px;border:1px solid var(--border);padding:6px 12px;border-radius:8px;transition:all .15s;white-space:nowrap}}
.back-btn:hover{{color:var(--gold);border-color:var(--gold-border)}}

.breadcrumb{{padding:.5rem 1.25rem;font-size:12px;color:var(--text-faint);border-bottom:1px solid var(--border);display:flex;gap:.4rem;align-items:center;flex-wrap:wrap}}
.breadcrumb a{{color:var(--text-faint);text-decoration:none}}
.breadcrumb a:hover{{color:var(--gold)}}

/* ── GRID DESKTOP ── */
.page-wrap{{width:100%;padding:1.5rem 2.5rem}}
.page-grid{{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:1.25rem;width:100%}}

/* ── GALERÍA ── */
.galeria-wrap{{position:relative;background:var(--surface);border-radius:var(--r);overflow:hidden;width:100%}}
.galeria-img{{width:100%;height:auto;max-height:460px;object-fit:cover;display:block}}
.img-contador{{position:absolute;top:10px;left:10px;background:rgba(0,0,0,.65);color:#fff;font-size:12px;padding:3px 10px;border-radius:20px;z-index:2}}
.galeria-nav{{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.55);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;transition:background .15s;z-index:2}}
.galeria-nav:hover{{background:rgba(212,168,75,.7)}}
.galeria-nav.prev{{left:10px}}.galeria-nav.next{{right:10px}}
.galeria-expand{{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.55);border:none;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;z-index:2;transition:background .15s}}
.galeria-expand:hover{{background:rgba(212,168,75,.7)}}
.miniaturas-wrap{{margin-top:.5rem;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin;scrollbar-color:var(--gold-border) transparent}}
.miniaturas-wrap::-webkit-scrollbar{{height:3px}}
.miniaturas-wrap::-webkit-scrollbar-track{{background:transparent}}
.miniaturas-wrap::-webkit-scrollbar-thumb{{background:var(--gold-border);border-radius:3px}}
.miniaturas{{display:flex;gap:.35rem}}
.miniatura{{width:68px;height:51px;object-fit:cover;border-radius:6px;flex-shrink:0;cursor:pointer;opacity:.55;transition:opacity .15s,border-color .15s;border:2px solid transparent}}
.miniatura.activa,.miniatura:hover{{opacity:1;border-color:var(--gold)}}

/* ── LIGHTBOX ── */
.lightbox{{display:none;position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:1000;align-items:center;justify-content:center}}
.lightbox.open{{display:flex}}
.lightbox img{{max-width:92vw;max-height:88vh;object-fit:contain;border-radius:8px}}
.lightbox-close{{position:absolute;top:16px;right:20px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;opacity:.7}}
.lightbox-close:hover{{opacity:1}}
.lightbox-nav{{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.1);border:none;color:#fff;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;transition:background .15s}}
.lightbox-nav:hover{{background:rgba(212,168,75,.5)}}
.lightbox-nav.prev{{left:16px}}.lightbox-nav.next{{right:16px}}
.lightbox-counter{{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:13px}}

/* ── PANEL DERECHO ── */
.prop-panel{{display:flex;flex-direction:column;gap:.85rem;min-width:0}}
.prop-tipo-badge{{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:4px;padding:.2rem .6rem;display:inline-block;margin-bottom:.4rem}}
.prop-codigo{{font-size:12px;color:var(--text-faint);margin-bottom:.2rem}}
.prop-nombre{{font-size:1.2rem;font-weight:600;color:#fff;line-height:1.3}}
.prop-precio{{font-size:1.4rem;font-weight:700;color:#22c55e;line-height:1}}

/* ── CHIPS ── */
.chips{{display:flex;flex-wrap:wrap;gap:.35rem}}
.chip{{display:inline-flex;align-items:center;gap:5px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 9px;font-size:12px;color:var(--text-muted)}}
.chip svg{{flex-shrink:0;color:var(--gold)}}

/* ── CTA ── */
.cta-group{{display:flex;flex-direction:column;gap:.5rem}}
.cta-wa{{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--gold);color:#000;font-weight:600;font-size:14px;padding:13px 16px;border-radius:10px;text-decoration:none;transition:opacity .15s}}
.cta-wa:hover{{opacity:.88}}
.cta-share{{display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border);color:var(--text-muted);font-size:13px;padding:10px 16px;border-radius:10px;cursor:pointer;background:none;transition:all .15s;font-family:'Outfit',sans-serif}}
.cta-share:hover{{color:var(--gold);border-color:var(--gold-border)}}
.share-confirm{{font-size:12px;color:var(--gold);text-align:center;display:none}}

/* ── CARACTERÍSTICAS / CONTENIDO ── */
.char-section,.content-section{{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:1rem}}
.section-title{{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:.75rem}}
.char-table{{width:100%;border-collapse:collapse;font-size:13px}}
.char-table tr{{border-bottom:1px solid var(--border)}}
.char-table tr:last-child{{border-bottom:none}}
.char-label{{color:var(--text-muted);padding:.45rem 0;width:50%}}
.char-val{{color:var(--text);font-weight:500;text-align:right;padding:.45rem 0}}
.content-text{{font-size:14px;color:var(--text-muted);line-height:1.8}}

.left-col{{display:flex;flex-direction:column;gap:.75rem;min-width:0}}

/* ── FOOTER ── */
.site-footer{{text-align:center;padding:1.5rem 1rem;font-size:12px;color:var(--text-faint);border-top:1px solid var(--border);margin-top:1.5rem}}
.site-footer a{{color:var(--text-faint);text-decoration:none}}
.site-footer a:hover{{color:var(--gold)}}

/* ── MÓVIL ── */
@media(max-width:680px){{
  .page-wrap{{padding:.75rem}}
  /* Convertir grid en flex column con orden explícito */
  .page-grid{{display:flex;flex-direction:column;gap:.75rem}}
  .left-col,.prop-panel{{display:contents}}
  /* Orden en móvil: galería → precio → chips → tabla → cta → desc */
  .sec-galeria{{order:1}}
  .sec-precio{{order:2}}
  .sec-chips{{order:3}}
  .sec-tabla{{order:4}}
  .sec-cta{{order:5}}
  .sec-desc{{order:6}}
  .sec-nombre{{order:7}} /* nombre/badge/codigo al final en móvil es raro — lo ponemos antes del precio */
  /* Reordenar más intuitivo: nombre→precio→galería→chips→tabla→cta→desc */
  .sec-nombre{{order:1}}
  .sec-precio{{order:2}}
  .sec-galeria{{order:3}}
  .sec-chips{{order:4}}
  .sec-tabla{{order:5}}
  .sec-desc{{order:6}}
  .sec-cta{{order:7}}
  .galeria-img{{max-height:280px}}
  .miniatura{{width:56px;height:42px}}
  .chip{{font-size:11px;padding:3px 7px}}
  .prop-nombre{{font-size:1.05rem}}
  .prop-precio{{font-size:1.25rem}}
}}
</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<!-- HEADER -->
<header class="site-header">
  <a href="{BASE_URL}" aria-label="ICDE Inmobiliaria – inicio">
    <img src="{LOGO_URL}" alt="ICDE Negocios Inmobiliarios" height="34"/>
  </a>
  <a href="{BASE_URL}" class="back-btn">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    Ver catálogo
  </a>
</header>

<!-- BREADCRUMB -->
<nav class="breadcrumb" aria-label="Ruta de navegación">
  <a href="{BASE_URL}">Inicio</a>
  <span>›</span>
  <a href="{BASE_URL}{int_url}">{tipo}s en Neiva</a>
  <span>›</span>
  <span>{nombre}</span>
</nav>

<!-- LIGHTBOX -->
<div class="lightbox" id="lightbox" onclick="cerrarLightbox(event)">
  <button class="lightbox-close" onclick="cerrarLightbox()">&#x2715;</button>
  <button class="lightbox-nav prev" onclick="lightboxNav(-1);event.stopPropagation()">&#8249;</button>
  <img id="lightboxImg" src="" alt="{alt_img}"/>
  <button class="lightbox-nav next" onclick="lightboxNav(1);event.stopPropagation()">&#8250;</button>
  <div class="lightbox-counter" id="lightboxCounter"></div>
</div>

<!-- CONTENIDO PRINCIPAL -->
<main>
  <div class="page-wrap">
  <div class="page-grid">

    <!-- COLUMNA IZQUIERDA: galería + descripción -->
    <div class="left-col">

      <div class="sec-galeria">
        {'<div class="galeria-wrap">' + galeria_html + '</div>' if galeria_html else ''}
        {miniaturas_html}
      </div>

      {f'<div class="sec-desc">{desc_puntos_combined}</div>' if desc_puntos_combined else ''}

    </div>

    <!-- COLUMNA DERECHA: nombre, precio, chips, tabla, cta -->
    <div class="prop-panel">

      <div class="sec-nombre">
        <span class="prop-tipo-badge">{tipo}</span>
        <p class="prop-codigo">Código: {esc(str(p.get("Código","")))} </p>
        <h1 class="prop-nombre">{esc(p.get("Nombre") or h1_text)}</h1>
      </div>

      {f'<div class="sec-precio"><p class="prop-precio">{precio}</p></div>' if precio else ''}

      {f'<div class="sec-chips">{chips_html}</div>' if chips_html else ''}

      {f'<div class="sec-tabla">{tabla_html}</div>' if tabla_html else ''}

      <div class="sec-cta">
        <div class="cta-group">
          <a href="https://wa.me/{PHONE}?text={wa_text}"
             class="cta-wa"
             target="_blank"
             rel="noopener noreferrer"
             aria-label="Agendar visita por WhatsApp">
            {ICONOS['wa']}
            Agendar visita por WhatsApp
          </a>
          <button class="cta-share" onclick="compartir()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Compartir
          </button>
          <p class="share-confirm" id="shareConfirm">¡Enlace copiado!</p>
        </div>
      </div>

    </div>

  </div>
  </div>
</main>

<!-- FOOTER -->
<footer class="site-footer">
  <p>
    <a href="{BASE_URL}">ICDE Negocios Inmobiliarios</a> &middot;
    {ADDRESS} &middot;
    <a href="tel:+{PHONE}">{PHONE_DISP}</a>
  </p>
  <p style="margin-top:.4rem">&copy; 2026 ICDE Negocios Inmobiliarios · Neiva, Huila, Colombia</p>
</footer>

<script>
var IMGS = {imgs_js};
var imgIndex = 0;

function irImg(i) {{
  if (!IMGS.length) return;
  imgIndex = (i + IMGS.length) % IMGS.length;
  document.getElementById('imgPrincipal').src = IMGS[imgIndex];
  var minis = document.querySelectorAll('.miniatura');
  minis.forEach(function(m,j){{ m.classList.toggle('activa', j===imgIndex); }});
  var activa = minis[imgIndex];
  if (activa) {{
    var wrap = activa.closest('.miniaturas-wrap');
    if (wrap) {{
      wrap.scrollTo({{ left: activa.offsetLeft - (wrap.offsetWidth/2) + (activa.offsetWidth/2), behavior:'smooth' }});
    }}
  }}
  var cont = document.getElementById('imgActual');
  if (cont) cont.textContent = imgIndex + 1;
}}

function cambiarImg(dir) {{ irImg(imgIndex + dir); }}

function abrirLightbox(i) {{
  irImg(i);
  var lb = document.getElementById('lightbox');
  document.getElementById('lightboxImg').src = IMGS[imgIndex];
  document.getElementById('lightboxCounter').textContent = (imgIndex+1) + ' / ' + IMGS.length;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}}

function cerrarLightbox(e) {{
  if (e && e.target !== document.getElementById('lightbox') && e.type !== 'click') return;
  if (e && e.currentTarget !== e.target && e.target.tagName === 'IMG') return;
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}}

function lightboxNav(dir) {{
  imgIndex = (imgIndex + dir + IMGS.length) % IMGS.length;
  document.getElementById('lightboxImg').src = IMGS[imgIndex];
  document.getElementById('lightboxCounter').textContent = (imgIndex+1) + ' / ' + IMGS.length;
}}

document.addEventListener('keydown', function(e) {{
  var lb = document.getElementById('lightbox');
  if (!lb.classList.contains('open')) return;
  if (e.key === 'ArrowRight') lightboxNav(1);
  if (e.key === 'ArrowLeft') lightboxNav(-1);
  if (e.key === 'Escape') cerrarLightbox({{target: lb}});
}});

function compartir() {{
  var url = window.location.href;
  if (navigator.clipboard) {{
    navigator.clipboard.writeText(url).then(function() {{
      var c = document.getElementById('shareConfirm');
      c.style.display = 'block';
      setTimeout(function(){{ c.style.display = 'none'; }}, 2000);
    }});
  }} else if (navigator.share) {{
    navigator.share({{ title: document.title, url: url }});
  }}
}}
</script>
</body>
</html>"""


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Descargar datos
    propiedades = descargar_propiedades()

    total = len(propiedades)
    ok = 0
    errores = []

    print(f"📝 Generando {total} archivos HTML en: {OUTPUT_DIR}")
    print("─" * 60)

    for i, p in enumerate(propiedades, 1):
        try:
            slug = generar_slug(p)
            if not slug:
                print(f"  ⚠ Sin slug — Código: {p.get('Código','?')} | Nombre: {p.get('Nombre','?')}")
                continue

            html     = build_html(p, slug)
            filename = slug + ".html"
            out_path = OUTPUT_DIR / filename
            out_path.write_text(html, encoding="utf-8")
            ok += 1

            if i % 50 == 0 or i == total:
                print(f"  ✓ {i}/{total} — {filename}")

        except Exception as e:
            errores.append((p.get("Código","?"), p.get("Nombre","?"), str(e)))
            print(f"  ✗ ERROR [{p.get('Código','?')}] {p.get('Nombre','?')}: {e}")

    print("─" * 60)
    print(f"✅ Completados: {ok}/{total}")
    if errores:
        print(f"❌ Errores ({len(errores)}):")
        for cod, nom, err in errores:
            print(f"   [{cod}] {nom}: {err}")
    else:
        print("🎉 Todas las propiedades generadas con SEO al 100% y diseño del modal.")


if __name__ == "__main__":
    main()
