import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('contabilidad_script.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
matches = list(re.finditer(r'</script', js, re.IGNORECASE))
print("contabilidad_script.js contains </script:", len(matches))
