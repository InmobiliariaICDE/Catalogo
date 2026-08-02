import json
from itertools import combinations

with open('admin_data.json', 'r', encoding='utf-8') as f:
    adminData = json.load(f)

props = []
for p in adminData.get('properties', []):
    rent = float(p.get('monthly_rent', 0) or 0)
    com = rent * 0.10
    props.append((p.get('name'), com))

print("Total properties:", len(props))
for name, com in props:
    print(f"{name}: {com}")

# Find any combination of 13 properties that sums to 883750
found = False
for combo in combinations(props, 13):
    s = sum(c[1] for c in combo)
    if abs(s - 883750) < 1:
        print("Found combination of 13 properties summing to 883750!")
        for name, com in combo:
            print(f"  - {name}: {com}")
        found = True
        break

if not found:
    print("No combination of 13 properties sums to 883750. Checking all subset sizes...")
    for k in range(1, len(props) + 1):
        for combo in combinations(props, k):
            s = sum(c[1] for c in combo)
            if abs(s - 883750) < 1:
                print(f"Found combination of {k} properties summing to 883750!")
                for name, com in combo:
                    print(f"  - {name}: {com}")
                found = True
                break
        if found: break
