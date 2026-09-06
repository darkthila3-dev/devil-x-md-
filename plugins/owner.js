const config = require('../config');
const { reply } = require('../lib/reply');

module.exports = {
  command: ['owner', 'creator'],
  description: 'Show bot owner contact',
  handler: async ({ sock, msg, from }) => {
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${config.BOT_NAME} Owner\n` +
      `ORG:${config.FOOTER};\n` +
      `TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\n` +
      'END:VCARD';

    await sock.sendMessage(
      from,
      {
        contacts: {
          displayName: `${config.BOT_NAME} Owner`,
          contacts: [{ vcard }],
        },
      },
      { quoted: msg }
    );

    await reply(sock, from, `👤 *Owner contact card sent above.*\nwa.me/${config.OWNER_NUMBER}`, msg);
  }
};
