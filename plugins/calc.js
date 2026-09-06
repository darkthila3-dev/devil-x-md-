const { evaluate } = require('mathjs');
const { reply } = require('../lib/reply');
const config = require('../config');

module.exports = {
  command: ['calc', 'calculate'],
  description: 'Evaluate a math expression',
  handler: async ({ sock, msg, from, args }) => {
    const expr = args.join(' ');

    if (!expr) {
      await reply(sock, from, `⚠️ Usage: ${config.PREFIX}calc <expression>\ne.g. ${config.PREFIX}calc (12 + 8) * 3`, msg);
      return;
    }

    try {
      const result = evaluate(expr);
      await reply(sock, from, `🧮 ${expr} = *${result}*`, msg);
    } catch (err) {
      await reply(sock, from, '❌ Invalid expression.', msg);
    }
  }
};
