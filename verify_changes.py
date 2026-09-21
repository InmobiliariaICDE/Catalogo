import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('admin.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()
checks = [
    ('parpadeoCitaRosa', 'Animacion CSS parpadeante rosa'),
    ('cita-solicitud-pendiente', 'Clase CSS parpadeante'),
    ('esSolicitud', 'Variable esSolicitud en cards'),
    ('confirmarCitaSolicitada', 'Funcion confirmarCitaSolicitada'),
    ('Confirmar Cita y Notificar al Cliente', 'Boton confirmar en modal'),
    ('Solicitud de Cita Pendiente', 'Banner solicitud pendiente'),
    ('wa.me', 'Link WhatsApp en confirmacion'),
    ('ICDE Inmobiliaria', 'Firma en mensaje WhatsApp'),
    ('ec4899', 'Color rosa principal'),
    ('badge-solicito', 'Badge solicito actualizado'),
]
print('=== Verificacion de cambios ===')
all_ok = True
for key, desc in checks:
    found = key in content
    status = 'OK' if found else 'FALTA'
    if not found:
        all_ok = False
    print(f'[{status}] {desc}')
print()
print('Todo correcto!' if all_ok else 'HAY PROBLEMAS - revisar')
