const { readdirSync } = require("fs");
const conf = require("../configs/config.json");
const ascii = require("ascii-table");
const table = new ascii().setHeading("Commands", "Load Status", "Description");

/**
 * Access levels:
 * 0  |  admin    |  @♠️ Admin
 * 1  |  mod      |  @💎 Twitch Mod
 * 2  |  sub      |  @🏆 Twitch Sub
 * 3  |  user     |  @🎮 Mitglied
 */

module.exports = client => {
  // get each filename as an element of array commands
  readdirSync("./commands/").forEach(dir => {
    const commands = readdirSync("./commands/" + dir).filter(f =>
      f.endsWith(".js")
    );

    // loop through commands
    for (let file of commands) {
      let pull = require("./../commands/" + dir + "/" + file);

      if (pull.name) {
        // check if command is enabled
        let activated = true;
        conf.commands.forEach(cmd => {
          if (cmd.name === file) {
            activated = cmd.enabled;
          }
        });
        if (activated) {
          client.commands.set(pull.name, pull);
          table.addRow(file, "  Active", pull.description);
        } else {
          table.addRow(file, "  Off", pull.description);
        }
      } else {
        table.addRow(file, "FAILED -> missing something?");
        continue;
      }

      if (pull.aliases && Array.isArray(pull.aliases))
        pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
    }
  });

  console.log(table.toString());
};
