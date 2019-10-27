const { getMember, formatDate } = require("./../../functions.js");
const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const conf = require("./../../conf/confBot.json");

module.exports = {
  name: "whois",
  aliases: ["userinfo", "user", "who"],
  category: "info",
  description: "Returns user information",
  usage: "[username | id, | mention]",
  run: async (client, message, args) => {
    const member = getMember(message, args.join(" "));

    // Member variables
    const joined = formatDate(member.joinedAt);
    const role =
      member.roles
        .filter(r => r.id !== message.guild.id)
        .map(r => r)
        .join(", ") || "none";

    // User variables
    const created = formatDate(member.user.createdAt);

    const embed = new RichEmbed()
      .setTitle("Information")
      .setFooter(member.displayName, member.user.displayAvatarURL)
      .setThumbnail(member.user.displayAvatarURL)
      .setColor(conf.colors.secondary)
      .addField(
        "User information",
          "**ID:** " +
          member.user.id +
          "\n**Username:** " +
          member.user.username +
          "\n**Discord Tag:** " +
          member.user.tag +
          "\n**Created at:** " +
          created,
        true
      )
      .addField(
        "Member information",
        "**Display name:** " +
          member.displayName +
          "\n**Joined at:** " +
          joined +
          "\n**Roles:** " +
          role,
        true
      );

    if (member.user.presence.game)
      embed.addField(
        "Currently playing",
        "**Name:** " + member.user.presence.game.name
      );

    message.channel.send(embed);
  }
};
