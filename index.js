const express = require('express');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const QRCode = require('qrcode');

const config = require('./config');
const { loadPlugins } = require('./lib/pluginLoader');
const { reply } = require('./lib/reply');
const { loadSettings, saveSettings, getEditableSettings } = require('./lib/settings');
const crypto = require('crypto');

loadSettings();

let plugins = loadPlugins();
let sock;
let pendingPairNumber = null;
let currentQR = null;
let connectedSince = null;

const validTokens = new Set();

function requireAuth(req, res, next) {
  const token = req.headers['x-dashboard-token'];
  if (token && validTokens.has(token)) return next();
  return res.status(401).json({ error: 'Not authenticated.' });
}

// ---------- Web server (pairing site + API) ----------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password !== config.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  validTokens.add(token);
  return res.json({ token });
});

app.get('/api/status', (req, res) => {
  const connected = !!sock?.authState?.creds?.registered;
  return res.json({
    connected,
    botName: config.BOT_NAME,
    number: connected ? sock?.user?.id?.split(':')[0] : null,
    connectedSince,
  });
});

app.get('/api/settings', requireAuth, (req, res) => {
  return res.json(getEditableSettings());
});

app.post('/api/settings', requireAuth, (req, res) => {
  const updated = saveSettings(req.body || {});
  return res.json({ ok: true, updated });
});

app.post('/api/pair', async (req, res) => {
  const { number } = req.body;

  if (!number || !/^\d{8,15}$/.test(number)) {
    return res.status(400).json({ error: 'Invalid number format.' });
  }

  if (sock?.authState?.creds?.registered) {
    return res.json({ alreadyConnected: true });
  }

  try {
    pendingPairNumber = number;
    const code = await sock.requestPairingCode(number);
    return res.json({ code });
  } catch (err) {
    console.error('[PAIR ERROR]', err.message);
    return res.status(500).json({ error: 'Failed to generate pairing code. Try again.' });
  }
});

app.get('/api/qr', async (req, res) => {
  if (sock?.authState?.creds?.registered) {
    return res.json({ alreadyConnected: true });
  }

  if (!currentQR) {
    return res.json({ qrImage: null }); // not generated yet, client should poll again shortly
  }

  try {
    const qrImage = await QRCode.toDataURL(currentQR);
    return res.json({ qrImage });
  } catch (err) {
    console.error('[QR ERROR]', err.message);
    return res.status(500).json({ error: 'Failed to render QR code.' });
  }
});

app.listen(config.PORT, () => {
  console.log(`🌐 Pairing site running at http://localhost:${config.PORT}`);
});

// ---------- WhatsApp bot ----------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();
  const wasAlreadyRegistered = state.creds.registered;

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // pairing happens through the web site instead
    browser: [config.BOT_NAME, 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
    }

    if (connection === 'close') {
      connectedSince = null;
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
      else console.log('Logged out. Delete /session and pair again via the web site.');
    } else if (connection === 'open') {
      console.log(`✅ ${config.BOT_NAME} connected successfully!`);
      pendingPairNumber = null;
      currentQR = null;
      connectedSince = Date.now();

      if (!wasAlreadyRegistered) {
        const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
        const welcomeText = `
👹 *${config.BOT_NAME.toUpperCase()} CONNECTED* 👹

✅ *Successfully paired!*

╭───────────────
│ 🤖 Bot     : ${config.BOT_NAME}
│ ⚙️ Prefix  : ${config.PREFIX}
│ 📡 Status  : Online & listening
╰───────────────

🔑 *Dashboard Password:* ${config.DASHBOARD_PASSWORD}
Save this — you'll need it to open your dashboard and change bot settings. Only you received this message.

Type *${config.PREFIX}menu* to see all commands.
        `.trim();

        try {
          await reply(sock, ownerJid, welcomeText);
        } catch (err) {
          console.error('[WELCOME MSG ERROR]', err.message);
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      '';

    // Owner hot-reload: send ".reload"
    if (body === `${config.PREFIX}reload`) {
      const sender = msg.key.participant || from;
      if (sender.includes(config.OWNER_NUMBER)) {
        plugins = loadPlugins();
        await reply(sock, from, '🔄 Plugins reloaded.', msg);
        return;
      }
    }

    if (!body.startsWith(config.PREFIX)) return;

    const args = body.slice(config.PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const plugin = plugins.get(cmdName);
    if (!plugin) return;

    try {
      await plugin.handler({ sock, msg, from, args, body });
    } catch (err) {
      console.error(`[COMMAND ERROR] ${cmdName}:`, err);
      await reply(sock, from, '⚠️ Command execution failed.', msg);
    }
  });

  return sock;
}

startBot().catch((err) => console.error('Fatal error starting bot:', err));
