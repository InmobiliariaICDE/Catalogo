import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Look for the first 500 chars of a property card to understand structure
# Find property-related patterns
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'property-card' in line or 'data-prop' in line or 'prop-id' in line or 'propertyId' in line:
        print(f'Line {i}: {line[:200]}')
        if i > 30:
            break
