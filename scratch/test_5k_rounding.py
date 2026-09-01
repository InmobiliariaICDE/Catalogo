import math

def round_down_5k(val):
    return math.floor(val / 5000) * 5000

test_cases = [
    557000,
    559000,
    553000,
    555000,
    562000,
    530000 * 1.05, # 556500 -> 555000
    630000 * 1.052, # 662760 -> 660000
    1260000 * 1.05, # 1323000 -> 1320000
]

print("=== ROUND DOWN TO 5.000 MULTIPLE TEST ===")
for tc in test_cases:
    res = round_down_5k(tc)
    print(f"Raw: {tc:<10.1f} | Rounded Down (5k): ${res:,.0f}")
