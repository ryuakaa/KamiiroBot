module.exports = {
  name: "ping",
  aliases: ["p"],
  category: "info",
  description: "Returns latency and API ping",
  run: async (client, message, args) => {
    const m = await message.channel.send("Pinging ...");
    m.edit(
      "Pong\nLatency is " +
        Math.floor(m.createdTimestamp - message.createdTimestamp) +
        "\nAPI Latency " +
        Math.round(client.ping) +
        "ms"
    );
  }
};
