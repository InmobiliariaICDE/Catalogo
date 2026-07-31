import re

with open('admin.html', encoding='utf-8') as f:
    text = f.read()

# Extract script blocks
script_blocks = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL)
print(f"Found {len(script_blocks)} script blocks")

main_script = script_blocks[2] # The main logic block (L14528-L16984)

# Let's inspect where renderContabilidad is defined
if "function renderContabilidad" in main_script:
    print("renderContabilidad function signature is present!")
else:
    print("renderContabilidad signature NOT found in main_script!")

# Let's check for any unterminated string literals or unmatched brackets inside functions
# Let's check all functions in main_script
funcs = re.findall(r'function\s+([a-zA-Z0-9_$]+)\s*\(', main_script)
print("Total functions found in main script:", len(funcs))
print("Is renderContabilidad in functions list?", 'renderContabilidad' in funcs)

# Let's check if there are duplicate function definitions or syntax anomalies around line 15589 - 16100
start_idx = text.find('async function renderContabilidad()')
print("Position of renderContabilidad:", start_idx)

# Let's view 100 lines before and after renderContabilidad
lines = text.split('\n')
for idx, line in enumerate(lines):
    if 'async function renderContabilidad()' in line:
        print(f"Found renderContabilidad at line {idx+1}")
        for j in range(max(0, idx-30), min(len(lines), idx+150)):
            if 'function ' in lines[j]:
                print(f"  Line {j+1}: {lines[j][:80]}")
