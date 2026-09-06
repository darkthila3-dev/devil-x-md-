const { reply } = require('../lib/reply');

module.exports = {
  command: ['quote', 'quotes'],
  description: 'Get a random quote',
  handler: async ({ sock, msg, from }) => {
    try {
      const res = await fetch('https://api.quotable.io/random');
      const data = await res.json();
      await reply(sock, from, `💬 _"${data.content}"_\n\n— ${data.author}`, msg);
    } catch (err) {
      console.error('[QUOTE ERROR]', err.message);
      await reply(sock, from, '❌ Could not fetch a quote right now, try again shortly.', msg);
    }
  }
};
