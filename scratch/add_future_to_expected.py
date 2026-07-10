file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the condition in getMonthlyComisionesData
old_condition = """        } else if (st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA') {
          expected[mIdx] += rent;
          if (val > 0) {
            collected[mIdx] += val;
          }
        }"""

new_condition = """        } else if (st === 'PREAVISO' || st === 'NEW_CONTRACT' || st === 'NO_RENEW' || st === 'DELIVERY' || st === 'AL_DIA' || st === 'FUTURE') {
          expected[mIdx] += rent;
          if (val > 0) {
            collected[mIdx] += val;
          }
        }"""

content = content.replace(old_condition, new_condition)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
