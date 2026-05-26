with open('ExtractorFotos.gs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

raw_level = 0
for i, line in enumerate(lines):
    line_num = i + 1
    for char in line:
        if char == '{':
            raw_level += 1
        elif char == '}':
            raw_level -= 1
    if raw_level < 0:
        print(f"L{line_num} NEGATIVE raw level: {raw_level} ({line.strip()})")

print("Final raw level:", raw_level)
