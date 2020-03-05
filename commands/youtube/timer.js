const { getErrorMessage, getDateTimeStr, makeID } = require("../../functions.js");
const { config } = require("dotenv");
const { Worker } = require("worker_threads");
const conf = require("./../../configs/config.json");
const ascii = require("ascii-table");


// amount of time, the timer stops printing messages if channel is online/streaming
var waitingTimeInHours = 12;
var idLength = 4;
var allWorkers = [];

// get env key
config({ path: "/.env" });

module.exports = {
  name: "timer",
  category: "youtube",
  description: "GETs data from youtube api",
  usage: "<start> <name/id> <interval in s> <channel id>",
  run: async (client, message, args) => {
    try {
      var errors = [];

      // choose command 
      if (args[0] == "start") {
        // start worker
        cmdStart();

      } else if (args[0] == "list") {
        // show cmd list in chat
        cmdList();

      } else if (args[0] == "stop") {
        // stops timer(s)
        cmdStop();
      }

      async function cmdStart() {
        // check arguments existing
        if (!args[1] || !args[2] || !args[3]) {
          errors.push("Arguments missing!");
        }

        // check if interval is valid
        if (isNaN(args[2]) || args[2] < 3) {
          errors.push("Interval is not a valid number!");
        }

        // set target channel
        var targetID = null;
        if (args[1] === "julie") {

          // choose julie
          targetID = conf.youtube.julie.channelID;
        } else if (args[1] === "nasa") {

          // choose nasa
          targetID = conf.youtube.nasa.channelID;
        } else if (args[1] != null && args[1].startsWith("id:")) {

          // choose id TODO exception handling if wrong id
          targetID = args[0];
        } else {
          errors.push("User/ID not found!");
        }

        // display errors and cancel if something is wrong
        if (errors.length != 0) {
          message.channel.send(getErrorMessage(errors));
        } else {

          // start worker
          await startWorker({
            id: "w" + makeID(idLength),
            status: "running",
            interval: args[2],
            target: targetID
          }).catch(err => {
            console.log(err)
            errors.push(err);
          });
        }
      }

      /**
       * Lists all Workers in allWorkers object with [id, interval, status] in table
       */
      function cmdList() {
        if (allWorkers.length <= 0) {

          message.channel.send("```css\nNo Timers running at the moment!```")

        } else {
          // build table
          var streamtable = new ascii().setHeading("Timer ID", "Target", "Interval in s", "Status");

          // build new table
          allWorkers.forEach(el => {
            streamtable.addRow(el.id, el.target, el.interval, el.status);
          });

          message.channel.send("```css\n" + streamtable.toString() + "```")
          var count = 0;
          allWorkers.forEach(el => {
            if (el.status == "running")
              count++;
          })
          console.log(getDateTimeStr() + count + "/" + allWorkers.length + " workers running!");
        }
      }

      /**
       * Lists all Workers in allWorkers object with [id, interval, status] in table
       */
      function cmdStop() {
        if (args[1] == "all") {
          // stop all timers 
          allWorkers.forEach(el => stopWorkerById(el.id));

        } else if (args[1] && !args[2]) {
          // stop 1 timer
          stopWorkerById(args[1]);

        } else {
          errors.push("Arguments missing or wrong!");
        }
      }

      // stop specific worker by id
      function stopWorkerById(id) {

        var entry = allWorkers.find(el => el.id == id);

        if (!entry) {
          message.channel.send(getErrorMessage(["Timer not found!"]));
          return;
        } else if (entry.status == "stopped") {
          message.channel.send(getErrorMessage(["Timer not running"]));
          return;
        }

        entry.status = "stopped";
        entry.worker.terminate();

        message.channel.send("```css\nStopped timer " + entry.id + " successfully!```")
      }

      async function startWorker(workerData) {

        // create worker object
        const worker = new Worker('./worker.js', { workerData });
        // worker listeners
        worker.on('message', obj => doCommandFromWorker(obj));
        worker.on('error', error => console.log(error));
        worker.on('exit', exitCode => {
          if (exitCode !== 0)
            console.log(getDateTimeStr() + "Worker " + workerData.id + " stopped with exit code " + exitCode);
        })

        // add to worker array
        allWorkers.push({
          worker,
          id: workerData.id,
          target: args[1],
          interval: args[2],
          status: workerData.status
        });

        message.channel.send("```css\nStarted timer " + workerData.id + " successfully!```")
        console.log(getDateTimeStr() + "Worker " + workerData.id + " started successfully!");
      }

      function doCommandFromWorker(obj) {
        if (obj.command == "say") {

          // prints a message in given channel
          message.channel.send(obj.text);
        } else if(obj.command == "status") {

          // prints a message in given channel + css code style
          message.channel.send("```css\n"+obj.text+" ```");
        } else if (obj.command == "log") {

          // print log
          console.log(getDateTimeStr() + obj.id + ": " + obj.text + " " + obj.target);
        } else if (obj.command == "streaming") {

          // A channel is streaming
          sendStreamNotification(client, obj.target)

        } else if(obj.command == "stop") {
          
          // Stop Timer (because of error?)
          stopWorkerById(obj.id);
        }
      }

      /**
       * sends message in channel
       * @param {*} msg on message
       * @param {*} item yt search response first item
       */
      function sendStreamNotification(client, item) {
        try {
          // get data from youtube api
          // let img = item.snippet.thumbnails.high.url;
          let url = "https://youtube.com/watch?v=" + item.id.videoId;

          // get textchannel settings and send in chosen channel | julie streamalerts: 588096212360757278
          client.channels
            .get(args[3])
            .send(
              "Hi @here, **" +
              item.snippet.channelTitle +
              "** ist ab jetzt live auf YouTube!\n" +
              url
            );
        } catch (error) {
          message.channel.send("```css\nFailed to post message in channel: "+args[3]+"```");
          console.log(getDateTimeStr() + "Failed to post message in channel: "+args[3]);
        }
      }

    } catch (error) {
      console.log(error);
      message.channel.send(getErrorMessage([error]));
    }
  }
}