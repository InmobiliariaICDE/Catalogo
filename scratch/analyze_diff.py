with open("scratch/git_diff_since_map_working.txt", "r", encoding='utf-8') as f:
    lines = f.readlines()

added_lines = []
deleted_lines = []
for line in lines:
    if line.startswith("+") and not line.startswith("+++"):
        added_lines.append(line[1:].strip())
    elif line.startswith("-") and not line.startswith("---"):
        deleted_lines.append(line[1:].strip())

print(f"Total added lines: {len(added_lines)}")
print(f"Total deleted lines: {len(deleted_lines)}")

# Look for JavaScript syntax suspects in added lines (e.g. mismatched braces, brackets, quotes)
print("\n--- Potential JS Syntax Suspects in added lines ---")
suspects = 0
for idx, line in enumerate(lines):
    if line.startswith("+") and not line.startswith("+++"):
        stripped = line[1:].strip()
        # Check for unbalanced characters in the single line (heuristic)
        for char_pair in [("(", ")"), ("[", "]"), ("{", "}")]:
            open_c, close_c = char_pair
            if open_c in stripped or close_c in stripped:
                open_cnt = stripped.count(open_c)
                close_cnt = stripped.count(close_c)
                # Ignore lines inside HTML template literals or simple assignments
                if open_cnt != close_cnt and not stripped.startswith("<") and not stripped.endswith(">"):
                    # Only print if it looks like actual JS statement
                    if any(x in stripped for x in ["const", "let", "var", "function", "=", "=>", "document."]):
                        print(f"Line {idx+1}: {line.strip()}")
                        suspects += 1
                        break
print(f"Found {suspects} potential suspects.")
