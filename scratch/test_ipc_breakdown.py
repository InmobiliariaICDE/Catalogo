import math

def calculate_ipc_rent(base_rent, ipc_pct):
    raw_increase = base_rent * (ipc_pct / 100.0)
    # Round down the increase to nearest 5000 multiple
    rounded_increase = math.floor(raw_increase / 5000.0) * 5000.0
    new_rent = base_rent + rounded_increase
    return {
        'base_rent': base_rent,
        'ipc_pct': ipc_pct,
        'raw_increase': raw_increase,
        'rounded_increase': rounded_increase,
        'new_rent': new_rent
    }

res = calculate_ipc_rent(530000, 5.10)
print("=== IPC BREAKDOWN FOR $530.000 @ 5.10% ===")
print(f"Base Rent: ${res['base_rent']:,.0f}")
print(f"IPC Rate: {res['ipc_pct']}%")
print(f"Raw Increase (5.10%): ${res['raw_increase']:,.2f} (~${round(res['raw_increase']):,.0f})")
print(f"Rounded Increase (favor de inquilino -> múltiplo de $5.000): ${res['rounded_increase']:,.0f}")
print(f"New Canon: ${res['new_rent']:,.0f}")
