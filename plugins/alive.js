const path = require('path');
const config = require('../config');
const { replyImage } = require('../lib/reply');

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

module.exports = {
  command: 'alive',
  description: 'Check if bot is online',
  handler: async ({ sock, msg, from }) => {
    const img = path.join(__dirname, '..', 'assets', 'alive.png');

    const text = `
👹 *${config.BOT_NAME} IS ALIVE* 👹

╭───────────────
│ ⏱️ Uptime : ${formatUptime(process.uptime())}
│ ⚙️ Prefix : ${config.PREFIX}
│ 📡 Status : Online & listening
╰───────────────

Type *${config.PREFIX}menu* to see all commands.
    `.trim();

    await replyImage(sock, from, img, text, msg);
  }
};
