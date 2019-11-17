const axios = require("axios");
const moment = require("moment");
const conf = require("./../../conf/confBot");
const { getErrorMessage } = require("./../../functions.js");

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
      let target = null;
      let counterInSec = null;

      // check parameters
      if (args.length != 3 || args[1] == null) {
        errors.push("Invalid parameter count!");
      }

      // check interval
      if (isNaN(args[2]) || args[2] < 3) {
        errors.push("Interval is not a valid number!");
      } else {
        counterInSec = args[2];
      }

      // get live streaming info
      if (args[0] === "live") {
        mode = "live";
      } else {
        errors.push("Mode not found!");
      }

      // set target channel
      if (args[1] === "julie") {
        // choose julie
        target = conf.yt.julie.channelId;
      } else if (args[1] != null && args[1].startsWith("id:")) {
        // choose id TODO exception handling if wrong id
        target = args[1].split("id:")[1];
      } else {
        errors.push("User/ID not found!");
      }

      // display errors and cancel if something is wrong
      if (errors.length != 0) {
        message.channel.send(getErrorMessage(errors, "-get live julie 10"));
        return;
      }

      // start loop
      if (mode === "live") {
        // start interval function
        message.channel.send(
          "Starting  with " + counterInSec + "s interval ..."
        );
        interval = setInterval(
          () => updateTimerLive(message, target),
          counterInSec * 1000
        );
      }
    } catch (error) {
      console.log(error);
      message.channel.send(error.toString());
    }

    /**
     * Is called every interval seconds
     * repeats until stop function stopTimer() is called
     */
    async function updateTimerLive(message, channelid) {
      try {
        // get channel live info
        let item = await getChannelInfo(channelid, "live");

        // check if item is a number, that would mean something is wrong!
        if (!isNaN(item)) {
          // rest service responed with an error
          let e = ["Server responded with status [" + item + "]"];
          message.channel.send(getErrorMessage(e));
          stopUpdateTimer(interval);
        }

        if (
          item != null &&
          item.snipper != null &&
          item.snippet.liveBroadcastContent != null
        ) {
          // stream online
          sendStreamNotification(message, item);
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
      message.channel.send("Stopping interval ...");
    }

    /**
     * Returns Channel info or status if response.status != 200
     * @param {*} channelId id
     * @param {*} eventType live, completed, etc
     * @returns {Object} returns json [item]
     */
    async function getChannelInfo(channelId, eventType) {
      let ret = null;
      await getStatus(channelId, eventType)
        .then(res => {
          // Success case
          console.log("success!");
          ret = res.response.data.items[0];
        })
        .catch(res => {
          // error case; return status
          if (res.response.status === 403) {
            console.log(
              "Server returned with status 403!\nDaily limit reached :("
            );
          } else {
            console.log(
              "Server responded with:\n" + res.response.data.error.message
            );
          }
          ret = res.response.status;
        });
      return ret;
    }

    /**
     * sends message in channel
     * @param {*} msg on message
     * @param {*} item yt search response first item
     */
    function sendStreamNotification(msg, item) {
      try {
        // get data from youtube api
        // let img = item.snippet.thumbnails.high.url;
        let url = "https://youtube.com/watch?v=" + item.id.videoId;

        msg.channel.send(
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
      });
    }
  }
};
