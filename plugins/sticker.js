const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { reply } = require('../lib/reply');
const config = require('../config');

module.exports = {
  command: ['sticker', 's'],
  description: 'Convert a quoted image into a sticker',
  handler: async ({ sock, msg, from }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = msg.message?.imageMessage || quoted?.imageMessage;

    if (!imageMsg) {
      await reply(sock, from, `⚠️ Send an image with caption ${config.PREFIX}sticker, or reply to an image with ${config.PREFIX}sticker.`, msg);
      return;
    }

    try {
      const buffer = await sock.downloadMediaMessage({ message: { imageMessage: imageMsg } });

      const sticker = new Sticker(buffer, {
        pack: config.BOT_NAME,
        author: config.FOOTER,
        type: StickerTypes.FULL,
        quality: 70,
      });

      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
    } catch (err) {
      console.error('[STICKER ERROR]', err.message);
      await reply(sock, from, '❌ Could not create the sticker. Try a different image.', msg);
    }
  }
};
