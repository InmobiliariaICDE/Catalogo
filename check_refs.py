with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.splitlines()

print(f'Total lines: {len(lines)}')
print()

# Find any remaining currentAdminSubTab === 'silvia'/'resumen' references
suspects = ['currentAdminSubTab', 'renderResumenCobros', 'renderEdificioSilvia', 'changeAdminSubTab']
for fn in suspects:
    idxs = [i+1 for i, l in enumerate(lines) if fn in l]
    print(f'{fn}: lines {idxs}')

print()
# Verify critical functions exist
critical = ['renderAdministracionContent', 'renderMatrizPagos', 'saveAdminPaymentStatus', 'saveAdminPropertyDetails']
for fn in critical:
    count = content.count(f'function {fn}')
    print(f'function {fn}: {count} definition(s)')

from html.parser import HTMLParser
class P(HTMLParser):
    def handle_starttag(self, t, a): pass
    def handle_endtag(self, t): pass
p = P()
try:
    p.feed(content)
    print('\nHTML parsing: OK')
except Exception as e:
    print(f'\nHTML ERROR: {e}')
