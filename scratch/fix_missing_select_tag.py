with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

target = """            <option value="2027" style="background-color: #121212; color: #fff;" ${currentAdminYear === '2027' ? 'selected' : ''}>2027</option>
          <button class="btn btn-gold btn-sm" """

replacement = """            <option value="2027" style="background-color: #121212; color: #fff;" ${currentAdminYear === '2027' ? 'selected' : ''}>2027</option>
          </select>
          <button class="btn btn-gold btn-sm" """

assert target in content, "Target string not found!"

content = content.replace(target, replacement)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Fixed missing </select> tag in admin.html!")
