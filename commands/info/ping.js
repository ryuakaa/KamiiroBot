const { stripIndents } = require("common-tags");

module.exports = {
  name: "ping",
  aliases: ["p"],
  category: "info",
  description: "Returns latency and API ping",
  run: async (client, message, args) => {
    const m = await message.channel.send("Pinging ...");
    const ping = Math.round(m.createdTimestamp - message.createdTimestamp);
    m.edit(
      stripIndents`
      🏓 P${"o".repeat(Math.ceil(ping / 100))}ng: \`${ping}ms\`
      💓 Heartbeat: \`${Math.round(message.client.ping)}ms\`
      `
    );
  }
};
