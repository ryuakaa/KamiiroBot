const {
  RichEmbed
} = require("discord.js");
const {
  stripIndents
} = require("common-tags");
const conf = require("./../../conf/confBot.json");

// TODO Testing
module.exports = {
  name: "report",
  category: "moderation",
  description: "Reports a member",
  usage: "<mention | id>",
  run: async (client, message, args) => {
    if (message.deletable) message.delete();

    let rMember =
      message.mentions.members.first() || message.guild.members.get(args[0]);

    if (!rMember)
      return message
        .reply("Couldn't find that person")
        .then(m => m.delete(5000));

    if (rMember.hasPermission("BAN_MEMBERS") || rMember.user.bot)
      return message
        .reply("Can't report that member")
        .then(m => m.delete(5000));

    if (!args[1])
      message.channel
      .send("Please provide a reason for the report!")
      .then(m => m.delete(5000));

    const channel = message.guild.channels.find(
      channel => channel.name === "reports"
    );

    if (!channel)
      return message.channel
        .send("I could not find a `#reports` channel")
        .then(m => m.delete(5000));

    const embed = new RichEmbed()
      .setColor(conf.colors.prim)
      .setTimestamp()
      .setFooter(message.guild.name, message.guild.iconURL)
      .setAuthor("Reported member", rMember.user.displayAvatarURL)
      .setDescription(
        "**Member:** " +
        rMember +
        " " +
        rMember.id +
        "\n**Reported by:** " +
        message.member +
        " (" +
        message.member.id +
        ")\n**Reported in:** " +
        message.channel +
        "\n**Reason:** " +
        args.slice(1).join(" ")
      );

    return channel.send(embed);
  }
};