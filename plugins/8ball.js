const { reply } = require('../lib/reply');
const config = require('../config');

const ANSWERS = [
  'Yes, definitely.',
  'It is certain.',
  'Without a doubt.',
  'Ask again later.',
  'Cannot predict now.',
  'Don\'t count on it.',
  'My sources say no.',
  'Very doubtful.',
  'Most likely.',
  'Signs point to yes.',
];

module.exports = {
  command: ['8ball', 'ask'],
  description: 'Ask the magic 8-ball a question',
  handler: async ({ sock, msg, from, args }) => {
    if (!args.length) {
      await reply(sock, from, `⚠️ Usage: ${config.PREFIX}8ball <your question>`, msg);
      return;
    }

    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    await reply(sock, from, `🎱 ${answer}`, msg);
  }
};
