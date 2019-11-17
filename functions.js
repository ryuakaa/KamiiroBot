const { getStatus } = require("./functions.js");

module.exports = {
  getMember(message, toFind = "") {
    toFind = toFind.toLowerCase();

    let target = message.guild.members.get(toFind);
    if (!target && message.mentions.members)
      target = message.mentions.members.first();

    if (!target && toFind) {
      target = message.guild.members.find(member => {
        return (
          member.displayName.toLowerCase().includes(toFind) ||
          member.user.tag.toLowerCase().includes(toFind)
        );
      });
    }
    if (!target) target = message.member;

    return target;
  },

  formatDate: date => {
    return new Intl.DateTimeFormat("en-US").format(date);
  },

  promptMessage: async function(message, author, time, validReactions) {
    time *= 1000;
    for (const reaction of validReactions) await message.react(reaction);

    const filter = (reaction, user) =>
      validReactions.includes(reaction.emoji.name) && user.id == author.id;

    return message
      .awaitReactions(filter, {
        max: 1,
        time: time
      })
      .then(collected => collected.first() && collected.first().emoji.name);
  },

  /**
   * @param {Array} errorArray Array of Strings
   * @param {String} example Example String
   */
  getErrorMessage(errorArray, example) {
    // build string
    let msg = "```css\n[Errors]\n";
    for (let i = 0; i < errorArray.length; i++) {
      msg += "[" + (i + 1) + "] " + errorArray[i] + "\n";
    }
    msg += "\n[Example]\n" + example + "```";
    return msg;
  },
  /**
   * @param {Array} errorArray Array of Strings
   * @param {String} example Example String
   */
  getErrorMessage(errorArray) {
    // build string
    let msg = "```css\n[Errors]\n";
    for (let i = 0; i < errorArray.length; i++) {
      msg += "[" + (i + 1) + "] " + errorArray[i] + "\n";
    }
    msg += "```";
    return msg;
  }
};
