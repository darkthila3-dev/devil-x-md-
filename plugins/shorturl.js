const { reply } = require('../lib/reply');
const config = require('../config');

module.exports = {
  command: ['shorturl', 'short'],
  description: 'Shorten a long URL',
  handler: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !/^https?:\/\//.test(url)) {
      await reply(sock, from, `⚠️ Usage: ${config.PREFIX}short <url starting with http(s)://>`, msg);
      return;
    }

    try {
      const short = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`).then(r => r.text());
      await reply(sock, from, `🔗 ${short}`, msg);
    } catch (err) {
      console.error('[SHORTURL ERROR]', err.message);
      await reply(sock, from, '❌ Could not shorten that link right now.', msg);
    }
  }
};
