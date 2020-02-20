
// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"

const { workerData, parentPort, Worker } = require('worker_threads')

// get interval seconds
var timeinterval = workerData.args[2];
var counter = 0;
var currentStatus = "running";

var intervalID = setInterval(() => update(parentPort), timeinterval * 1000);

parentPort.on("message", message => {
  if (message === "exit") {

    currentStatus = "stopped";

    // delete interval 
    clearInterval(intervalID);
    clearInterval(intervalStatus);

    // send stop command | currently not implemented
    //sendResponse(pPort, "stop", message);
    parentPort.close();
  } else {
    console.log("Worker " + workerData.id + " received: " + message);
  }
});


/**
 * Updates every timeinterval seconds
 * @param {MessagePort} pPort 
 */
function update(pPort) {

  
  sendResponse(pPort, "say", "Hello from worker " + workerData.id);
}

/**
 * Builds Response Object
 * @param {MessagePort} pPort 
 * @param {String} status 
 * @param {String} command 
 * @param {String} text 
 * @param {Object} data 
 */
function sendResponse(pPort, command, text, data) {
  pPort.postMessage({
    id: workerData.id,
    counter: counter++,
    status: currentStatus || "",
    command: command || "",
    text: text || "",
    data: data || ""
  });
}

/**
     * Is called every <interval> seconds
     * repeats until stop function stopUpdateTimer() is called
     */
    async function updateTimerLive(message, channelID, interID) {
      try {
        // get channel live info
        let item = await getChannelInfo(channelID, "live");

        // check if failed
        if (item == null) {
          /////////////////////// nothing found -> Probably offline
          console.log(
            getDateTimeStr() + "Timer " + interID + ": Channel is offline or nothing found!"
          );

          changePropertyOfTimers(interID, 3, "offline");

        } else if (
          item != null &&
          item.response != null &&
          !isNaN(item.response.status)
        ) {
          /////////////////////// rest service responded with an error
          console.log(
            getDateTimeStr() + "Timer " + interID + ": responed with an error!"
          );

          let e = [item];
          e.push(item.response.data.error.message);
          message.channel.send(getErrorMessage(e));

          changePropertyOfTimers(interID, 3, "failed");

        } else if (
          item.snippet != null &&
          item.snippet.liveBroadcastContent != null
        ) {
          /////////////////////// stream online
          console.log(
            getDateTimeStr() + "Timer " + interID + ": Channel is streaming"
          );

          changePropertyOfTimers(interID, 3, "streaming");

          // send notification in alerts chat
          sendStreamNotification(client, message, item);
        }

        // check if valid timer and stop invalid timers
        var status = interval[0][3];

        if (status == "failed" || status == "streaming") {
          stopUpdateTimer(message, interID);
          return;
        }
      } catch (error) {
        console.log(error);
      }
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