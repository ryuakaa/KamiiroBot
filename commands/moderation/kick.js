const { promptMessage } = require("./../../functions.js");
const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const conf = require("./../../configs/config.json");

module.exports = {
  name: "kick",
  category: "moderation",
  description: "Kicks the member",
  usage: "mention | id>",
  run: async (client, message, args) => {
    const logChannel =
      message.guild.channels.find(c => c.name === "logs") || message.channel;

    if (message.deletable) message.delete();

    // no args
    if (!args[0]) {
      return message
        .reply("Please provide a person to kick")
        .then(m => m.delete(5000));
    }
    // no args
    if (!args[1]) {
      return message
        .reply("Please provide a reason to kick")
        .then(m => m.delete(5000));
    }
    // no author permissions
    if (!message.member.hasPermission("KICK_MEMBERS")) {
      return message
        .reply(
          "You do not have permissions to kick members. Please contact a staff member"
        )
        .then(m => m.delete(5000));
    }
    // no bot permissions
    if (!message.guild.me.hasPermission("KICK_MEMBERS")) {
      return message
        .reply(
          "I do not have permissions to kick members. Please contact a staff member"
        )
        .then(m => m.delete(5000));
    }

    const toKick =
      message.mentions.members.first() || message.guild.members.get(args[0]);

    // no member found
    if (!toKick) {
      return message
        .reply("Couldn't find that member, try again!")
        .then(m => m.delete(5000));
    }
    // Can't kick yourself
    if (message.author.id === toKick.id) {
      return message
        .reply("You can't kick yourself, you idiot!")
        .then(m => m.delete(5000));
    }
    // kickable
    if (toKick.kickable) {
      return message
        .reply("I can't kick that person due to role hierarchy, I suppose.")
        .then(m => m.delete(5000));
    }

    const embed =
      new RichEmbed()
        .setColor(conf.colors.primary)
        .setThumbnail(toKick.user.displayAvatarURL)
        .setFooter(message.member.displayName, message.author.displayAvatarURL)
        .setTimestamp()
        .setDescription("**Kicked member: **" + toKick + " " + toKick.id) +
      "\n**Kicked by:** " +
      message.author +
      " " +
      message.author.id +
      "\n**Reason:** " +
      args.slice(1).join(" ");

    const promptEmbed = new RichEmbed()
      .setColor(conf.colors.primary)
      .setAuthor("This verification becomes invalid after 30s")
      .setDescription("Do you want to kick " + toKick + "?");

    //TODO fix
    message.channel.send(promptEmbed).then(async msg => {
      const emoji = await promptMessage(msg, message.author, 30, [
        ":white_check_mark:",
        ":x:"
      ]);

      if (emoji == ":white_check_mark:") {
        msg.delete(5000);
        toKick.kick(args.slice[1].join(" ")).catch(err => {
          if (err)
            return message.channel.send("Well..... Something went wrong?");
        });
        logChannel.send(embed);
      } else if (emoji == ":x:") {
        msg.delete();

        message.reply("Kick canceled...").then(m => m.delete(5000));
      }
    });
  }
};
