import json

with open("admin_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    print("Properties count:", len(data.get("properties", [])))
    print("First property JSON:")
    print(json.dumps(data["properties"][0], indent=2))
