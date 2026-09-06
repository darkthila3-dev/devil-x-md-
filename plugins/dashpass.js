const config = require('../config');
const { reply } = require('../lib/reply');

module.exports = {
  command: ['dashpass', 'getpassword'],
  description: 'Resend the dashboard password (owner only)',
  handler: async ({ sock, msg, from }) => {
    const sender = msg.key.participant || from;

    if (!sender.includes(config.OWNER_NUMBER)) {
      await reply(sock, from, '⚠️ Only the bot owner can use this command.', msg);
      return;
    }

    await reply(sock, from, `🔑 *Dashboard Password:* ${config.DASHBOARD_PASSWORD}`, msg);
  }
};
