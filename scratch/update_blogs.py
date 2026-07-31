import os
import sys
import json
import re
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

blog_dir = 'blog'
blog_html_path = 'blog.html'
sitemap_path = 'sitemap.xml'

# 1. Parse all blogs
blogs = []
for f in os.listdir(blog_dir):
    if f.endswith('.html'):
        path = os.path.join(blog_dir, f)
        with open(path, 'r', encoding='utf-8') as file:
            soup = BeautifulSoup(file.read(), 'html.parser')
            
            title = soup.title.string if soup.title else ''
            # Clean title
            title_clean = title.split('|')[0].strip()
            
            desc_meta = soup.find('meta', {'name': 'description'})
            desc = desc_meta['content'] if desc_meta else ''
            
            # Find datePublished in JSON-LD
            ld_json = soup.find_all('script', type='application/ld+json')
            date = '2026-07-27' # default
            for ld in ld_json:
                try:
                    data = json.loads(ld.string)
                    if data.get('@type') == 'BlogPosting':
                        date = data.get('datePublished', date)
                except:
                    pass
            
            # Word count reading time estimate
            body_text = soup.get_text()
            word_count = len(body_text.split())
            est_time = max(5, round(word_count / 200))
            read_time = f'{est_time} min de lectura'
            
            # Simple heuristic for tags
            tag = 'Blog'
            filename_lower = f.lower()
            if 'arriendo' in filename_lower or 'administracion' in filename_lower or 'inquilino' in filename_lower:
                tag = 'Arriendo'
            elif 'avaluo' in filename_lower:
                tag = 'Avalúos'
            elif 'compra' in filename_lower or 'apartamento' in filename_lower:
                tag = 'Compra'
            elif 'inversion' in filename_lower or 'valorizacion' in filename_lower:
                tag = 'Inversión'
            elif 'credito' in filename_lower:
                tag = 'Financiación'
            elif 'barrio' in filename_lower:
                tag = 'Barrios'
            elif 'tramite' in filename_lower:
                tag = 'Trámites'
            elif 'vender' in filename_lower or 'venta' in filename_lower:
                tag = 'Venta'
            elif 'comercial' in filename_lower:
                tag = 'Comercial'
                
            blogs.append({
                'filename': f,
                'slug': f.replace('.html', ''),
                'title': title.strip(),
                'title_clean': title_clean,
                'desc': desc.strip(),
                'tag': tag,
                'read_time': read_time,
                'date': date
            })

# Sort blogs by date descending, then title
blogs.sort(key=lambda x: (x['date'], x['filename']), reverse=True)

print(f"Parsed {len(blogs)} blogs.")

# 2. Update blog.html
with open(blog_html_path, 'r', encoding='utf-8') as f:
    blog_html_content = f.read()

# Generate new blog-grid HTML
grid_html = '    <div class="blog-grid">\n\n'
for i, b in enumerate(blogs, 1):
    grid_html += f'        <!-- Blog {i}: {b["title_clean"]} -->\n'
    grid_html += f'        <article class="blog-card">\n'
    grid_html += f'            <div class="blog-card-tag">{b["tag"]}</div>\n'
    grid_html += f'            <h2 class="blog-card-title"><a href="https://icdeinmobiliaria.com/blog/{b["slug"]}">{b["title_clean"]}</a></h2>\n'
    grid_html += f'            <p class="blog-card-desc">{b["desc"]}</p>\n'
    grid_html += f'            <div class="blog-card-footer">\n'
    grid_html += f'                <span class="blog-card-time">{b["read_time"]}</span>\n'
    grid_html += f'                <a href="https://icdeinmobiliaria.com/blog/{b["slug"]}" class="blog-card-link">Leer más →</a>\n'
    grid_html += f'            </div>\n'
    grid_html += f'        </article>\n\n'
grid_html += '    </div>'

# Replace grid in blog.html
pattern = r'<div class="blog-grid">.*?</div>'
updated_blog_html, count = re.subn(pattern, grid_html, blog_html_content, flags=re.DOTALL)
if count > 0:
    with open(blog_html_path, 'w', encoding='utf-8') as f:
        f.write(updated_blog_html)
    print("Successfully updated blog.html grid.")
else:
    print("ERROR: Could not find blog-grid container in blog.html")

# 3. Update each individual blog file's related section
for current_blog in blogs:
    # Categorize related blogs: pick same tag first, then fallback to others
    same_tag = [b for b in blogs if b['tag'] == current_blog['tag'] and b['slug'] != current_blog['slug']]
    other_tag = [b for b in blogs if b['tag'] != current_blog['tag'] and b['slug'] != current_blog['slug']]
    
    # Prioritize certain categories if same_tag doesn't have enough
    # If Arriendo/Avalúos/Venta, combine them as related
    arriendo_group = ['Arriendo', 'Avalúos', 'Venta']
    compra_group = ['Compra', 'Inversión', 'Financiación', 'Barrios', 'Trámites', 'Blog']
    
    if current_blog['tag'] in arriendo_group:
        same_group = [b for b in blogs if b['tag'] in arriendo_group and b['slug'] != current_blog['slug']]
        other_group = [b for b in blogs if b['tag'] not in arriendo_group and b['slug'] != current_blog['slug']]
    else:
        same_group = [b for b in blogs if b['tag'] in compra_group and b['slug'] != current_blog['slug']]
        other_group = [b for b in blogs if b['tag'] not in compra_group and b['slug'] != current_blog['slug']]
        
    related_candidates = same_group + other_group
    related_selected = related_candidates[:4]
    
    # Generate related section HTML
    rel_html = '        <div class="icde-blogs-rel-grid">\n'
    for r in related_selected:
        # Clean title to keep it short
        r_title = r['title_clean'].replace('2026', '').replace('  ', ' ').strip()
        rel_html += f'            <a class="icde-blog-card" href="https://icdeinmobiliaria.com/blog/{r["slug"]}">\n'
        rel_html += f'                <p class="icde-blog-card-tag">{r["tag"]}</p>\n'
        rel_html += f'                <p class="icde-blog-card-title">{r_title}</p>\n'
        rel_html += f'                <p class="icde-blog-card-desc">{r["desc"]}</p>\n'
        rel_html += f'            </a>\n'
    rel_html += '        </div>'
    
    path = os.path.join(blog_dir, current_blog['filename'])
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
        
    pattern_rel = r'<div class="icde-blogs-rel-grid">.*?</div>'
    new_content, count = re.subn(pattern_rel, rel_html, content, flags=re.DOTALL)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated related section in {current_blog['filename']}")
    else:
        print(f"WARNING: Could not find related grid in {current_blog['filename']}")

# 4. Update sitemap.xml
with open(sitemap_path, 'r', encoding='utf-8') as f:
    sitemap_content = f.read()

# Let's extract existing sitemap entries
# We will construct clean sitemap entries for all blogs, removing any existing ones if they exist, or just placing them all nicely.
# Let's find where the blog URLs fit.
# We can find all existing <loc>https://icdeinmobiliaria.com/blog/.*?</loc> blocks and replace them or rewrite the sitemap neatly.
# Let's parse sitemap with bs4 or regex. Since sitemap is XML:
soup_sitemap = BeautifulSoup(sitemap_content, 'xml')
# Find all <url> tags where <loc> contains /blog/
url_tags = soup_sitemap.find_all('url')
blogs_inserted = set()

# Remove old blog entries (except main /blog page)
for url_tag in url_tags:
    loc = url_tag.loc.string if url_tag.loc else ''
    if '/blog/' in loc:
        url_tag.decompose()

# Now insert all 16 blogs before the first non-blog URL after the main /blog page, or just append them.
# Let's find the main /blog page url tag
blog_main_url_tag = None
for url_tag in soup_sitemap.find_all('url'):
    loc = url_tag.loc.string if url_tag.loc else ''
    if loc == 'https://icdeinmobiliaria.com/blog':
        blog_main_url_tag = url_tag
        break

if blog_main_url_tag:
    # Insert new ones right after blog_main_url_tag
    current_element = blog_main_url_tag
    for b in blogs:
        new_url_tag = soup_sitemap.new_tag('url')
        
        loc_tag = soup_sitemap.new_tag('loc')
        loc_tag.string = f'https://icdeinmobiliaria.com/blog/{b["slug"]}'
        new_url_tag.append(loc_tag)
        
        lastmod_tag = soup_sitemap.new_tag('lastmod')
        lastmod_tag.string = b['date']
        new_url_tag.append(lastmod_tag)
        
        freq_tag = soup_sitemap.new_tag('changefreq')
        freq_tag.string = 'monthly'
        new_url_tag.append(freq_tag)
        
        prio_tag = soup_sitemap.new_tag('priority')
        prio_tag.string = '0.7'
        new_url_tag.append(prio_tag)
        
        current_element.insert_after(new_url_tag)
        current_element = new_url_tag
        
    # Write back
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        # soup_sitemap.prettify() or just write it
        f.write(str(soup_sitemap))
    print("Successfully updated sitemap.xml with all 16 blogs.")
else:
    print("ERROR: Could not find main blog entry in sitemap.xml")
