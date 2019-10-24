const { Client } = require("discord.js");
const { config } = require("dotenv");
const botconfig = require("./bot-config.json");

const client = new Client({
    disableEveryone: true
});

const COLOR = {
    "primary":"#32d370",
    "secondary":"#0C7CD5"};


config({
    path: __dirname + "/.env"
});

// say hello 
client.on("ready", async() => {
    console.log("> "+client.user.username+" is online!");
    // client.user.setActivity("with yt api!");
    client.user.setPresence({
        status: "online",
        game:  {
            name: "twitch.tv/juliversal",
            type: "WATCHING"
        }
    })
});

client.on("message", async msg => {
    console.log("["+msg.author.username+"] said: "+msg.content);
});

client.login(botconfig.token);

