import re
import sys
import os

# Add scratch to python path so we can import esprima
sys.path.insert(0, os.path.abspath("scratch"))
import esprima

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', content, re.DOTALL)
all_ok = True
for i, s in enumerate(scripts):
    if len(s.strip()) == 0:
        continue
    print(f"\nParsing script block {i} (len={len(s)})...")
    try:
        esprima.parseScript(s)
        print(f"Script Block {i}: Parsed successfully!")
    except Exception as e:
        print(f"Script Block {i} FAILED: {e}")
        all_ok = False
        
        # Try to locate the error in the original file
        # Let's extract the line number of the error (usually given as "Line X: ...")
        err_msg = str(e)
        match = re.search(r'Line (\d+):', err_msg)
        if match:
            err_line_in_block = int(match.group(1))
            # Find the starting line of the script tag in admin.html
            # Let's count newlines in content until we reach the script tag
            # We can find the i-th script block index
            matches = list(re.finditer(r'<script\b[^>]*>(.*?)</script>', content, re.DOTALL))
            if i < len(matches):
                m = matches[i]
                start_pos = m.start(1)
                before_script = content[:start_pos]
                script_start_line = before_script.count('\n') + 1
                error_line_in_file = script_start_line + err_line_in_block - 1
                print(f"---> ERROR AT LINE {error_line_in_file} IN admin.html")
                
                # Print context
                lines = content.splitlines()
                start_l = max(1, error_line_in_file - 5)
                end_l = min(len(lines), error_line_in_file + 5)
                for cur_l in range(start_l, end_l + 1):
                    prefix = "-> " if cur_l == error_line_in_file else "   "
                    print(f"{prefix}{cur_l}: {lines[cur_l-1]}")

if all_ok:
    print("\nSUCCESS: All script blocks are syntactically valid!")
else:
    print("\nFAILURE: One or more script blocks have syntax errors.")
