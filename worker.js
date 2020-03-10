// WORKER_THREADS worker script

const axios = require("axios");
const conf = require("./configs/config.json");

const { workerData, parentPort } = require('worker_threads')

var counter = 0;
var currentStatus = "running";

var intervalID = setInterval(() => update(parentPort), workerData.interval * 1000);

// receive messages
parentPort.on("message", message => {
  if (message === "exit") {
    stopMe();
  } else {
    console.log("Worker " + workerData.id + " received: " + message);
  }
});

/**
 * Updates every workerData.interval seconds
 * @param {MessagePort} pPort 
 */
async function update(pPort) {
  try {
    // get channel live info
    let item = await getChannelInfo(workerData.target, "live");

    // check if failed
    if (item == null) {
      /////////////////////// nothing found -> Probably offline
      sendResponse(pPort, "log", "Channel offline", "");
    } else if (
      item != null &&
      item.response != null &&
      !isNaN(item.response.status)
    ) {
      /////////////////////// rest service responded with an error
      sendResponse(pPort, "status", "Failed to get information! Restservice failed?");
      sendResponse(pPort, "stop");
      sendResponse(pPort, "log", "Error occoured:", "Restservice failed!");
    } else if (
      item.snippet != null &&
      item.snippet.liveBroadcastContent != null
    ) {
      /////////////////////// stream online
      sendResponse(pPort, "streaming", workerData.target + " is streaming", item);
    }
  } catch (error) {
    sendResponse(pPort, "log", "Error occoured:", error);
  }
}

function stopMe() {
  currentStatus = "stopped";

  // delete interval 
  clearInterval(intervalID);

  //sendResponse(pPort, "stop", message);
  parentPort.close();
}

/**
 * Builds Response Object
 * @param {MessagePort} pPort 
 * @param {String} status 
 * @param {String} command 
 * @param {String} text 
 * @param {String} target
 */
function sendResponse(pPort, command, text, target) {
  pPort.postMessage({
    id: workerData.id,
    counter: counter++,
    status: currentStatus || "",
    command: command || "",
    text: text || "",
    target: target || ""
  });
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