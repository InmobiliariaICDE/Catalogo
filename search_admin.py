import re

def search_keywords(filename, keywords):
    out_lines = []
    out_lines.append(f"Searching in {filename}...")
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for kw in keywords:
        out_lines.append(f"\n--- Results for: {kw} ---")
        matches = []
        for idx, line in enumerate(lines):
            if re.search(kw, line, re.IGNORECASE):
                matches.append((idx + 1, line.strip()))
        
        # Show first 50 matches
        for num, text in matches[:50]:
            out_lines.append(f"Line {num}: {text}")
        if len(matches) > 50:
            out_lines.append(f"... and {len(matches) - 50} more matches.")
            
    with open('search_results.txt', 'w', encoding='utf-8') as out_f:
        out_f.write('\n'.join(out_lines))
    print("Done. Saved results to search_results.txt")

keywords = [
    r'swExtraerLinkIA',
    r'swExtraerScreenshotIA',
    r'swExtraerTextoIA',
    r'swShowReviewForm',
]

search_keywords('admin.html', keywords)
