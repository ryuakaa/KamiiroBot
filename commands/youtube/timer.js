const axios = require("axios");
const conf = require("./../../configs/config");
const ascii = require("ascii-table");
const { getErrorMessage, getDateTimeStr } = require("../../functions.js");
const { config } = require("dotenv");
const { Worker, isMainThread } = require("worker_threads");

var textChannelID = null;

var workerNum = 0;
var allWorkers = [];

// get env key
config({ path: "/.env" });

module.exports = {
  name: "timer",
  category: "youtube",
  description: "GETs data from youtube api",
  usage: "<name/id> <interval in s> <optional channel id>",
  run: async (client, message, args) => {
    try {

      /**
       * Returns Promise with worker + eventlisteners in it
       * @param {Object} workerData Object filled with information for the worker
       */
      function createWorkerPromise(workerData) {
        return new Promise((resolve, reject) => {
          const worker = new Worker('./worker.js', { workerData });
          // execute command and maybe resolve afterwards
          worker.on('message', obj => doCommandFromWorker(resolve, obj));
          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code !== 0)
              reject(new Error(`Worker stopped with exit code ${code}`));
          })

          // add to worker array
          //console.log("added worker to list, interval: "+workerData.args[2])
          allWorkers.push({
            id: workerData.id,
            target: args[1],
            interval: workerData.args[2],
            status: workerData.status
          });
        })
      }

      /**
       * Execute command from worker
       * @param {void} resolve If this is called then the promise is resolved
       * @param {Object} workerData Object filled with information from theworker 
       */
      function doCommandFromWorker(resolve, obj) {
        var id = obj.id;
        var counter = obj.counter;
        var status = obj.status;
        var cmd = obj.command;
        var text = obj.text;
        var data = obj.data;

        if (cmd == "updateStatus") {
          // updates status of worker with specific id 
          updateStatusOfWorker(id, status);

        } else if (cmd == "say") {
          // prints a message in given channel
          message.channel.send(text);

        } else if (cmd == "stop") {
          // stops worker
          message.channel.send(text);
          resolve(obj);
        }

      }

      /**
       * Updates the status of a single worker
       * @param {Number} id 
       * @param {String} status 
       */
      function updateStatusOfWorker(id, status) {
        // for (var i = 0; i < allWorkers.length; i++) {
        //   allWorkers[id].status = status;
        // }
        allWorkers.find(el => el.id == id).status = status;
      }

      /**
       * Create worker-promise with data and handle resolve/reject case
       * Object receives id and arguments
       */
      async function cmdStart() {
        // async !
        await createWorkerPromise({
          id: workerNum++,
          args
        }).then(obj => {
          // PROMISE RESOLVED
          // worker is resolved -> interval is stopped
          console.log("Worker " + obj.id + " resolved after " + obj.counter + " ticks! " + obj.text);

        }).catch(err => {

          // PROMISE REJECTED
          var errors = [];
          errors.push("Worker rejected!");
          errors.push(err.toString());

          // send error msg in channel and log
          message.channel.send(getErrorMessage(errors));
          console.log(errors);
        })
      }

      /**
       * Lists all Workers in allWorkers object with [id, interval, status] in table
       */
      function cmdList() {
        if (allWorkers.length <= 0) {

          message.channel.send("```\nNo Timers running at the moment!```")
          console.log("No timers running");
        } else {
          // build table
          var streamtable = new ascii().setHeading("Timer ID", "Target", "Interval in s", "Status");
          // build new table
          allWorkers.forEach(el => {
            streamtable.addRow(el.id, el.target, el.interval, el.status);
          });

          message.channel.send("```\n" + streamtable.toString() + "```")
          console.log(streamtable.toString());
        }
      }

      var errors = [];

      var command = args[0];
      var target = args[1];
      var option = args[2];
      var channel = args[3];

      if (command == "start") {

        if (args[1] && args[2] && args[3]) {
          cmdStart();
        } else {
          errors.push("Arguments missing!");
        }
      } else if (command == "list") {
        cmdList();
      }

      // display errors and cancel if something is wrong
      if (errors.length != 0) {
        message.channel.send(getErrorMessage(errors));
        return;
      }


      // let errors = [];
      // //let mode = "live";
      // let target = null;
      // let counterInSec = null;

      // // check if timer should be stopped
      // if (args[0] == "stop") {
      //   // STOP TIMER
      //   if (!isNaN(args[1]) && args[1]) {
      //     stopUpdateTimer(message, args[1]);
      //   } else {
      //     errors.push("Invalid timer ID!");
      //   }
      //   return;
      // } else if (args[0] == "list") {
      //   // LIST ALL TIMERS

      //   interval.forEach(el => {
      //     streamtable.addRow(el[1], el[2], el[3]);
      //   });

      //   message.channel.send("```\n" + streamtable.toString() + "```")
      //   console.log(streamtable.toString());
      //   return;
      // } else {
      //   // OTHER

      //   // check parameters
      //   // if (args.length != 3 || args[1] == null) {
      //   //   errors.push("Invalid parameter count!");
      //   // }

      //   // check interval
      //   if (isNaN(args[1]) || args[1] < 3) {
      //     errors.push("Interval is not a valid number!");
      //   } else {
      //     counterInSec = args[1];
      //   }

      //   // "live" will be the default value
      //   // check request mode
      //   // if (args[0] === "live") {
      //   //   mode = "live";
      //   // } else {
      //   //   errors.push("Mode not found!");
      //   // }

      //   // check if textchannel
      //   if (args[2]) {
      //     // text channel provided
      //     textChannelID = args[2];
      //   } else {
      //     // read default from config
      //     conf.commands.forEach(el => {
      //       if (el.name === "timer.js") {
      //         textChannelID = el.defaultTextChannelID;
      //       }
      //     });
      //   }

      //   // set target channel
      //   if (args[0] === "julie") {
      //     // choose julie
      //     target = conf.youtube.julie.channelID;
      //   } else if (args[0] === "nasa") {
      //     // choose nasa
      //     target = conf.youtube.nasa.channelID;
      //   } else if (args[0] != null && args[1].startsWith("id:")) {
      //     // choose id TODO exception handling if wrong id
      //     target = args[0];
      //   } else {
      //     errors.push("User/ID not found!");
      //   }
      // }
      // // display errors and cancel if something is wrong
      // if (errors.length != 0) {
      //   message.channel.send(
      //     getErrorMessage(errors, "-get [user] [inverval in s] [channel id]")
      //   );
      //   return;
      // }

      // // Create a new Timer
      // createInterval(message, target, counterInSec);

    } catch (error) {
      console.log(error);
      message.channel.send(getErrorMessage([error]));
    }

    // create new Interval
    function createInterval(message, target, counterInSec) {
      // next interval id
      var id = makeID(lengthID);
      // start interval
      var intObj = setInterval(
        () => updateTimerLive(message, target, id),
        counterInSec * 1000
      );
      // add to interval object 
      interval.push([intObj, id, counterInSec, "running"]);

      message.channel.send("Started Timer " + id + " with " + counterInSec + "s interval ");
      console.log(getDateTimeStr() + "Started Timer " + id + " with " + counterInSec + "s interval ");
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
     * Stopps the interval provided as parameter and sends a short message
     * @param {*} interv
     */
    function stopUpdateTimer(message, id) {

      // check for equal id and remove that interval element
      var entry = null;
      interval.forEach(el => {
        if (el[1] == id) {
          entry = el;
        }
      })

      // delete timer
      clearInterval(entry[0]);

      if (index > -1) {
        var index = interval.indexOf(entry);
        interval.splice(index, 1);

        message.channel.send("Timer " + id + " stopped!");
        console.log(getDateTimeStr() + "Timer " + id + " stopped!");
      } else {
        message.channel.send("Timer " + id + " could not be stopped probably!");
        console.log(getDateTimeStr() + "Timer " + id + " could not be stopped probably!");
      }
    }

    function changePropertyOfTimers(id, index, value) {
      interval.forEach(el => {
        if (el[1] == id) {
          // found
          el[index] = value;
        }
      })
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

    function makeID(length) {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
  }
};
