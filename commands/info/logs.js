const { RichEmbed } = require("discord.js");
const {
  getDateTimeStr,
  changePropertyInConfig
} = require("./../../functions.js");

module.exports = {
  name: "logs",
  category: "info",
  description: "Turns logs on/off ",
  usage: "logs",
  run: async (client, message, args) => {
    // delete cached version of config
    delete require.cache[require.resolve("./../../configs/config.json")];
    // get config
    conf = require("./../../configs/config.json");
    // change setting in file
    changePropertyInConfig("generateLogs", !conf.generateLogs);
    // send msg
    message.channel.send("Generate Logs switched to " + !conf.generateLogs);
  }
};
