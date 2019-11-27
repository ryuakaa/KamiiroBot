const { stat, readFile, writeFile } = require("fs");
const { getDateTimeStr } = require("./functions.js");

module.exports = {
  /**
   *
   * @param {*} message
   * @param {string} [toFind=""]
   * @returns
   */
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
  /**
   * Formats Date
   * @param {*} date
   * @returns
   */
  formatDate: date => {
    return new Intl.DateTimeFormat("en-US").format(date);
  },
  /**
   * @param {*} message
   * @param {*} author
   * @param {*} time
   * @param {*} validReactions
   * @returns
   */
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
    if (example) msg += "\n[Example]\n" + example + "```";
    else msg += "\n```";
    return msg;
  },
  /**
   * Return the Date and Time for console outputs
   * @returns {String} date | time
   */
  getDateTimeStr() {
    let d = new Date();
    return d.toLocaleDateString() + " | " + d.toLocaleTimeString() + " > ";
  },
  /**
   * Changes property in configs.json and writes updated version
   * @param {*} propertyname
   * @param {*} value
   */
  changePropertyInConfig(propertyname, value) {
    // TODO make prettier version
    let d = new Date();
    let str = d.toLocaleDateString() + " | " + d.toLocaleTimeString() + " > ";
    let path = "./configs/config.json";
    // read file
    readFile(path, "utf8", (err, data) => {
      if (err) {
        console.log(str + "Could NOT read file " + path);
      } else {
        // change property in json
        let obj = JSON.parse(data);
        obj[propertyname] = value;
        // write to file
        let json = JSON.stringify(obj, null, 2);
        writeFile(path, json, "utf8", info => {
          console.log(str + "changed property " + propertyname + "=" + value);
        });
      }
    });
  }
};
