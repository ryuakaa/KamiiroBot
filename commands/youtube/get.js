const axios = require("axios");
const conf = require("./../../configs/config");
const { getErrorMessage, getDateTimeStr } = require("./../../functions.js");
const { config } = require("dotenv");

var interval = null;
var textChannelID = null;

// get env key
config({ path: "/.env" });

module.exports = {
  name: "get",
  category: "youtube",
  description: "GETs data from youtube api",
  usage: "<name/id> <interval in s> <optional channel id>",
  run: async (client, message, args) => {
    try {
      let errors = [];
      let mode = "live";
      let target = null;
      let counterInSec = null;

      // check parameters
      // if (args.length != 3 || args[1] == null) {
      //   errors.push("Invalid parameter count!");
      // }

      // check interval
      if (isNaN(args[1]) || args[1] < 3) {
        errors.push("Interval is not a valid number!");
      } else {
        counterInSec = args[1];
      }

      // "live" will be the default value
      // check request mode
      // if (args[0] === "live") {
      //   mode = "live";
      // } else {
      //   errors.push("Mode not found!");
      // }

      // check if textchannel
      if (args[2]) {
        // text channel provided
        textChannelID = args[2];
      } else {
        // read default from config
        conf.commands.forEach(el => {
          if (el.name === "get.js") {
            textChannelID = el.defaultTextChannelID;
          }
        });
      }

      // set target channel
      if (args[0] === "julie") {
        // choose julie
        target = conf.youtube.julie.channelID;
      } else if (args[0] === "nasa") {
        // choose nasa
        target = conf.youtube.nasa.channelID;
      } else if (args[0] != null && args[1].startsWith("id:")) {
        // choose id TODO exception handling if wrong id
        target = args[0];
      } else {
        errors.push("User/ID not found!");
      }

      // display errors and cancel if something is wrong
      if (errors.length != 0) {
        message.channel.send(
          getErrorMessage(errors, "-get julie 10 [opt. channelID]")
        );
        return;
      }

      // start loop
      if (mode === "live") {
        // start interval function
        message.channel.send(getDateTimeStr() + "Started with " + counterInSec + "s interval ");

        interval = setInterval(
          () => updateTimerLive(message, target),
          counterInSec * 1000
        );
      }
    } catch (error) {
      console.log(error);
      message.channel.send(getErrorMessage([error]));
    }

    /**
     * Is called every <interval> seconds
     * repeats until stop function stopUpdateTimer(obj) is called
     */
    async function updateTimerLive(message, channelID) {
      try {
        // get channel live info
        let item = await getChannelInfo(channelID, "live");

        // check if failed
        if (item == null) {
          /////////////////////// nothing found -> Probably offline
          console.log(
            getDateTimeStr() + channelID + " is offline or nothing found!"
          );
        } else if (
          item != null &&
          item.response != null &&
          !isNaN(item.response.status)
        ) {
          /////////////////////// rest service responed with an error
          let e = [item];
          e.push(item.response.data.error.message);
          message.channel.send(getErrorMessage(e));
          // stop timer
          stopUpdateTimer(interval);
        } else if (
          item.snippet != null &&
          item.snippet.liveBroadcastContent != null
        ) {
          /////////////////////// stream online
          sendStreamNotification(client, message, item);
          // stop timer
          stopUpdateTimer(interval);
        }
      } catch (error) {
        console.log(error);
      }
    }

    /**
     * Stopps the interval provided as parameter and sends a short message
     * @param {*} interv
     */
    function stopUpdateTimer(interv) {
      clearInterval(interv);
      console.log("Stopping interval...");
    }

    /**
     * Returns Channel info or status if response.status != 200
     * @param {*} channelID id
     * @param {*} eventType live, completed, etc
     * @returns {Object} returns json [item] or error code
     */
    async function getChannelInfo(channelID, eventType) {
      let ret = null;
      await getStatus(channelID, eventType)
        .then(res => {
          // Success case
          if (res.status === 200) {
            // rest service successfull
            console.log(getDateTimeStr() + "GET successful!");

            if (res.data.items.length > 0) {
              // found something
              ret = res.data.items[0];
            } else {
              ret = null;
            }
          }
        })
        .catch(res => {
          // error case; return response
          console.log(getDateTimeStr() + "GET failed!");
          ret = res;
        });
      return ret;
    }

    /**
     * sends message in channel
     * @param {*} msg on message
     * @param {*} item yt search response first item
     */
    function sendStreamNotification(client, msg, item) {
      try {
        // get data from youtube api
        // let img = item.snippet.thumbnails.high.url;
        let url = "https://youtube.com/watch?v=" + item.id.videoId;

        // get textchannel settings and send in chosen channel | julie streamalerts: 588096212360757278
        client.channels
          .get(textChannelID)
          .send(
            "Hi @here, **" +
            item.snippet.channelTitle +
            "** ist ab jetzt live auf YouTube!\n" +
            url
          );
      } catch (error) {
        console.log(error);
      }
    }

    /**
     * Returns response data from channel
     * @param {String} channelID
     * @param {String} eventType
     * @returns {Object}
     */
    async function getStatus(channelID, eventType) {
      return axios({
        method: "GET",
        url:
          "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" +
          channelID +
          "&type=video&eventType=" +
          eventType +
          "&key=" +
          // google api account
          process.env.GOOGLE
      });
    }
  }
};
