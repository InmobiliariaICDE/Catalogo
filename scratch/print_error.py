import urllib.request
from bs4 import BeautifulSoup # if installed, otherwise regex

url = "https://script.google.com/macros/s/AKfycbzFUuzwKA_5C35NX7S2eniREyP8AAqqYxz4rUoL195-vfIuiis8KmG3IbKIojfywllI1w/exec?action=getLeadName&leadId=1776570877954"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        print("Response length:", len(content))
        # Find error message
        import re
        msg_match = re.search(r'<div class="errorMessage">(.*?)</div>', content, re.DOTALL)
        if msg_match:
            print("Error message:", msg_match.group(1).strip())
        else:
            print("No errorMessage div found. Full response:")
            print(content)
except Exception as e:
    print("Failed to request:", e)
