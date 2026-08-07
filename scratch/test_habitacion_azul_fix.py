import json

d = json.load(open('admin_data.json', encoding='utf-8'))
p = [x for x in d['properties'] if 'HABITACION AZUL' in x['name'].upper()][0]

# Simulate user changing AGOSTO to VACANT
agosto_cell = [m for m in p['payments']['2026'] if m['month'] == 'AGOSTO'][0]
agosto_cell['status'] = 'VACANT'
agosto_cell['value'] = 'DESOCUPADO'

print("Before ensureUniqueIds simulation:")
print("AGOSTO cell:", agosto_cell)

# Now test the condition:
# isVacantCell = (m.status == 'VACANT' or 'DESOCUPAD' in str(m.value).upper()) and not isPaidCell
is_paid = agosto_cell['status'] == 'PAID'
is_vacant_cell = (agosto_cell['status'] == 'VACANT' or 'DESOCUPAD' in str(agosto_cell['value']).upper()) and not is_paid

print("isVacantCell:", is_vacant_cell)
if is_vacant_cell:
    final_st = 'VACANT'
    final_val = 'DESOCUPADO'
print("Final result for AGOSTO:", final_st, final_val)
