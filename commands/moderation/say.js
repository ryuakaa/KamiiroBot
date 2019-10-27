const { RichEmbed } = require("discord.js");
const conf = require("./../../conf/confBot.json");

module.exports = {
  name: "say",
  aliases: ["bc", "broadcast"],
  category: "moderation",
  description: "Says your input via the bot",
  usage: "<input>",
  run: async (client, message, args) => {
    try {
      if (message.deletable) message.delete();

      if (args.length < 1)
        return message.reply("Nothing to say?").then(m => m.delete(5000));

      if (args[0] === "embed") {
        const embed = new RichEmbed()
          .setColor(conf.colors.prim)
          .setDescription(args.slice(1).join(" "))
          .setTimestamp()
          // .setImage(client.user.displayAvatarURL)
          .setAuthor(message.author.name, message.author.displayAvatarURL)
          .setFooter(client.user.username, client.user.displayAvatarURL);

        message.channel.send(embed);
      } else {
        message.channel.send(args.join(" "));
      }
    } catch (error) {
      message.channel.send("Something went wrong!");
    }
  }
};
