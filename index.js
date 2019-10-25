/**
 * TODO
 *
 */

const Discord = require("discord.js");
const { Client, RichEmbed } = require("discord.js");
const { config } = require("dotenv");
const bconfig = require("./bot-config.json");
const axios = require("axios");
const moment = require("moment");

const client = new Client({
  disableEveryone: true
});

config({
  path: __dirname + "/.env"
});

client.on("ready", async () => {
  console.log("> " + client.user.username + " is online!");
  // client.user.setActivity("with yt api!");
  client.user.setPresence({
    status: "online",
    game: {
      name: "twitch.tv/juliversal",
      type: "WATCHING"
    }
  });
});

client.on("message", async msg => {
  console.log(
    "[" + msg.guild.name + "/" + msg.author.username + "] said: " + msg.content
  );
  // fetch(
  //   "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCXqlds5f7B2OOs9vQuevl4A&type=video&eventType=live&key=AIzaSyCZ9Hxb4EI5XMwYD9OjuyZljPbnMgG_YmQ"
  // ).then(resp => {
  //   console.log(resp);
  // });

  if (!msg.content.startsWith(bconfig.prefix) || msg.author.bot) return;

  const args = msg.content
    .slice(bconfig.prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();
  args.forEach(el => {
    el.toLowerCase();
  });

  if (cmd === "ping") {
    const m = await msg.channel.send("Pinging ...");
    m.edit(
      "Pong\nLatency is " +
        Math.floor(m.createdTimestamp - msg.createdTimestamp) +
        "\nAPI Latency " +
        Math.round(client.ping) +
        "ms"
    );
  }

  if (cmd === "get") {
    // if (args.length < 1)
    //   return msg.reply("Nothing to say?").then(m => m.delete(5000));
    try {
      if (args[0] === "live") {
        let res = await getStatus(args[1], "live");

        if (isStreaming(res, args[1])) {
          console.log("yes");
          // send message
          msg.channel.send(getStreamNotification(msg, res));
        } else {
          msg.channel.send("This channel is offline!");
        }
      }
    } catch (error) {
      console.log(error);
      // msg.channel.sendMessage(error);
    }
  }
});

async function getStatus(channelid, eventType) {
  return axios({
    method: "GET",
    url:
      "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" +
      channelid +
      "&type=video&eventType=" +
      eventType +
      "&key=" +
      bconfig.ytkey
  }).then(res => res.data);
}

function isStreaming(res, channelId) {
  // checks if a channel is streaming
  try {
    if (res.items[0] == undefined) return false;

    let live = res.items[0].snippet.liveBroadcastContent;
    if (live == undefined || live == "live") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

// returns stream notification embed
function getStreamNotification(msg, res) {
  // get data from youtube api
  let item = res.items[0];
  let img = item.snippet.thumbnails.high.url;
  let url = "https://youtube.com/watch?v=" + item.id.videoId;

  return (
    "Hi @here, **" +
    item.snippet.channelTitle +
    "** ist ab jetzt live auf YouTube!\n" +
    url
  );
}

client.login(bconfig.token);
