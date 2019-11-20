/**
 * TODO
 *
 */

const { Client, Collection } = require("discord.js");
const { config } = require("dotenv");
const conf = require("./conf/config");

config({
  path: __dirname + "/.env"
});

const client = new Client({
  disableEveryone: true
});

client.commands = new Collection();
client.aliases = new Collection();

// find all command js files
["command"].forEach(handler => {
  require("./handler/" + handler)(client);
});

// wake up
client.on("ready", async () => {
  console.log("> " + client.user.username + " is now running...");
  // client.user.setActivity("with yt api!");
  client.user.setPresence({
    status: "online",
    game: {
      name: "twitch.tv/juliversal",
      type: "WATCHING"
    }
  });
});

// message is sent event
client.on("message", async msg => {
  // ignore messages for nonprefix and bot
  if (!msg.content.startsWith(conf.prefix) || msg.author.bot || !msg.guild)
    return;
  // fetch member if there is none
  if (!msg.member) msg.member = await msg.guild.fetchMember(msg);

  // split input into cmd and arguments
  const args = msg.content
    .slice(conf.prefix.length)
    .trim()
    .split(/ +/g);
  args.forEach(el => {
    el.toLowerCase();
  });
  const cmd = args.shift();

  let command = client.commands.get(cmd);

  if (cmd.length === 0) return;

  if (!command) command = client.commands.get(client.aliases.get(cmd));

  if (command) command.run(client, msg, args);
});

client.login(process.env.TOKEN);
