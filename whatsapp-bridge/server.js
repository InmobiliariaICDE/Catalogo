const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Cargar mensajes existentes
let messageHistory = {};
if (fs.existsSync(MESSAGES_FILE)) {
    try {
        messageHistory = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    } catch (e) {
        console.error('Error cargando historial:', e);
    }
}

function saveMessages() {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messageHistory, null, 2));
}

let sock; // Socket global

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['ICDE CRM', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. ¿Reconectar?:', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Conectado y listo para el CRM!');
        }
    });

    // Escuchar mensajes entrantes y salientes
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.message) continue;
                
                const remoteJid = msg.key.remoteJid;
                if (!remoteJid || !remoteJid.endsWith('@s.whatsapp.net')) continue;

                const phone = remoteJid.replace('@s.whatsapp.net', '');
                const fromMe = msg.key.fromMe;
                const pushName = msg.pushName || (fromMe ? 'Yo' : 'Cliente');
                
                let text = '';
                if (msg.message.conversation) text = msg.message.conversation;
                else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text;
                else if (msg.message.buttonsResponseMessage) text = msg.message.buttonsResponseMessage.selectedButtonId;
                else if (msg.message.listResponseMessage) text = msg.message.listResponseMessage.title;
                
                if (text) {
                    if (!messageHistory[phone]) messageHistory[phone] = [];
                    
                    // Evitar duplicados (por wamid)
                    if (messageHistory[phone].some(x => x.id === msg.key.id)) continue;

                    messageHistory[phone].push({
                        id: msg.key.id,
                        fromMe,
                        pushName,
                        text,
                        timestamp: msg.messageTimestamp,
                        status: msg.status
                    });
                    
                    // Limitar a los últimos 100 mensajes por chat
                    if (messageHistory[phone].length > 100) messageHistory[phone].shift();
                    
                    saveMessages();
                    console.log(`📩 [${fromMe ? 'OUT' : 'IN'}] Mensaje de/para ${phone}: ${text.substring(0, 30)}...`);
                }
            }
        }
    });
}

// Rutas API fuera de connectToWhatsApp para evitar duplicación
app.post('/send-message', async (req, res) => {
    try {
        if (!sock) {
            return res.status(503).send({ error: 'WhatsApp no está conectado' });
        }
        
        const { number, message } = req.body;
        let cleanNumber = number.replace(/\D/g, '');
        if (!cleanNumber.startsWith('57')) cleanNumber = '57' + cleanNumber;
        const jid = `${cleanNumber}@s.whatsapp.net`;
        
        const sent = await sock.sendMessage(jid, { text: message });
        
        // No guardamos en historial aquí; dejamos que messages.upsert lo haga de forma unificada
        res.send({ status: 'sent', to: jid, messageId: sent.key.id });
        console.log(`📤 Mensaje enviado a: ${cleanNumber}`);
    } catch (err) {
        console.error('❌ Error al enviar:', err.message);
        res.status(500).send({ error: err.message });
    }
});

app.get('/messages/:number', (req, res) => {
    let phone = req.params.number.replace(/\D/g, '');
    if (!phone.startsWith('57')) phone = '57' + phone;
    res.send(messageHistory[phone] || []);
});

connectToWhatsApp();

const PORT = 3000;
app.listen(PORT, () => {
    console.log('--------------------------------------------------');
    console.log(`🚀 Puente CRM-WhatsApp corriendo en http://localhost:${PORT}`);
    console.log('--------------------------------------------------');
});
