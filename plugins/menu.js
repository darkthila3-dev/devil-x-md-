const path = require('path');
const config = require('../config');
const { replyImage } = require('../lib/reply');

module.exports = {
  command: ['menu', 'help'],
  description: 'Show bot menu',
  handler: async ({ sock, msg, from }) => {
    const p = config.PREFIX;
    const text = `
╭───「 *${config.BOT_NAME} X MD* 」───╮

*🛠️ GENERAL*
│ ▢ ${p}menu
│ ▢ ${p}ping
│ ▢ ${p}alive
│ ▢ ${p}uptime
│ ▢ ${p}owner
│ ▢ ${p}about
│ ▢ ${p}jid
│ ▢ ${p}time

*👥 GROUP*
│ ▢ ${p}tagall
│ ▢ ${p}groupinfo
│ ▢ ${p}dashpass

*📥 DOWNLOADER*
│ ▢ ${p}tiktok <url>
│ ▢ ${p}fb <url>

*🎨 TOOLS & FUN*
│ ▢ ${p}gen <prompt>
│ ▢ ${p}quote
│ ▢ ${p}weather <city>
│ ▢ ${p}short <url>
│ ▢ ${p}sticker

╰──────────────────╯

Add your own commands inside /plugins
    `.trim();

    const img = path.join(__dirname, '..', 'assets', 'menu.png');
    await replyImage(sock, from, img, text, msg);
  }
};
