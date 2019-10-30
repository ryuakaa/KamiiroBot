const axios = require("axios");
const moment = require("moment");
const conf = require("./../../conf/confBot");
const {} = require("./../../functions.js");

var interval = null;

module.exports = {
  name: "get",
  category: "youtube",
  description: "GETs data from youtube api",
  usage: "<live> <name/id> <interval in s>",
  run: async (client, message, args) => {
    try {
      let errors = [];
      let mode = "";
      let res = null;

      // check parameters
      args.forEach(el => {
        if (el) {
          return el;
        } else {
          return "";
        }
      });

      // check interval
      if (isNaN(args[2])) {
        errors.push("Interval is not a number!");
      }

      // get live streaming info
      if (args[0] === "live") {
        mode = "live";
      } else {
        errors.push("Mode not found!");
      }

      // choose channel juliversal
      if (args[1] === "julie") {
        // start loop
        interval = setInterval(
          () => updateTimer(message, conf.julie.channelid),
          args[2] * 1000
        );
      } else if (args[1].startsWith("id:")) {
        // get channel id
        let id = args[1].split("id:")[1];
        // start loop
        interval = setInterval(() => updateTimer(message, id), args[2] * 1000);
      } else {
        errors.push("User not found!");
      }

      // display errors
      if (errors.length != 0) {
        message.send(errors);
      }
    } catch (error) {
      console.log(error);
      message.channel.send(error.toString());
    }

    /**
     * Is called every interval seconds
     * repeats until stop function stopTimer() is called
     */
    async function updateTimer(message, channelid) {
      // get channel live info
      res = await getChannelInfo(channelid, "live");
      if (res != null) {
        // stream online
        sendStreamNotification(message, res);
      } else {
        console.log("Stream is not live");
      }
    }
    /**
     * Checks if field is not null
     * @param {String} field
     * @returns "" or field
     */
    function cf(field) {
      if (field) {
        return field;
      } else {
        return "";
      }
    }

    /**
     * Returns response data from channel
     * @param {String} channelid
     * @param {String} eventType
     * @returns {Object}
     */
    async function getStatus(channelid, eventType) {
      return axios({
        method: "GET",
        url:
          "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" +
          channelid +
          "&type=video&eventType=" +
          eventType +
          "&key=" +
          conf.ytkey
      }).then(res => res.data);
    }

    /**
     * Returns Channel info
     * @param {*} channelId id
     * @param {*} eventType live, completed, etc
     * @returns {Object} returns json [item]
     */
    async function getChannelInfo(channelId, eventType) {
      try {
        // get response from rest service
        let res = await getStatus(channelId, eventType);
        // no search results
        if (res.pageInfo.totalResults === 0) {
          return null;
        }
        // take first item and return it
        return res.items[0];
      } catch (error) {
        if (error.response.status != 200) {
          console.log("Got status " + error.response.status + " back!");
          return null;
        }
      }
    }

    /**
     * sends message in channel
     * @param {*} msg on message
     * @param {*} res yt response
     */
    function sendStreamNotification(msg, res) {
      try {
        if (res) {
          // get data from youtube api
          let item = res.items[0];
          let img = item.snippet.thumbnails.high.url;
          let url = "https://youtube.com/watch?v=" + item.id.videoId;

          if (res.pageInfo.totalResults === 0) {
            msg.channel.send("Channel is currently **not** streaming!");
            return;
          }

          msg.channel.send(
            "Hi @here, **" +
              item.snippet.channelTitle +
              "** ist ab jetzt live auf YouTube!\n" +
              url
          );
        } else {
          // channel is offline
          msg.channel.send("Channel is currently **not** streaming!");
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
};
