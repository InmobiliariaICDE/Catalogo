file_path = r"c:\Users\USUARIO\Documents\GitHub\Catalogo\admin.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the height of the chart container in javascript layout rendering
old_height = '<div style="height:140px; position:relative; width:100%;">'
new_height = '<div style="height:165px; position:relative; width:100%;">'
content = content.replace(old_height, new_height)

# 2. Update font sizes in Chart config
old_font_config = """              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#ccc',
                  font: { size: 9, weight: '600' },
                  boxWidth: 10,
                  padding: 8
                }
              },"""

new_font_config = """              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#ccc',
                  font: { size: 11, weight: '600' },
                  boxWidth: 12,
                  padding: 10
                }
              },"""

content = content.replace(old_font_config, new_font_config)

# Update X-axis tick font size
old_x_ticks = """              x: {
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: '#888', font: { size: 9 } }
              },"""

new_x_ticks = """              x: {
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: '#aaa', font: { size: 11, weight: '500' } }
              },"""

content = content.replace(old_x_ticks, new_x_ticks)

# Update Y-axis tick font size
old_y_ticks = """              y: {
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: {
                  color: '#888',
                  font: { size: 9 },"""

new_y_ticks = """              y: {
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: {
                  color: '#aaa',
                  font: { size: 11, weight: '500' },"""

content = content.replace(old_y_ticks, new_y_ticks)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
