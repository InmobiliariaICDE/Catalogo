import urllib.request
import urllib.parse

base_url = "https://script.google.com/macros/s/AKfycbzFUuzwKA_5C35NX7S2eniREyP8AAqqYxz4rUoL195-vfIuiis8KmG3IbKIojfywllI1w/exec"

url = f"{base_url}?action=getAdminData"
print(f"Testing getAdminData...")
try:
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        status = response.status
        content = response.read().decode('utf-8')
        print(f"  Status: {status}")
        print(f"  Length: {len(content)}")
        print(f"  Snippet: {content[:300]}")
except Exception as e:
    print(f"  Failed: {e}")
print("-" * 50)
