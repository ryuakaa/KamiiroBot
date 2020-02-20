const axios = require("axios");
const conf = require("./../../configs/config");
const ascii = require("ascii-table");
const { getErrorMessage, getDateTimeStr, makeID } = require("../../functions.js");
const { config } = require("dotenv");
const { Worker } = require("worker_threads");

var textChannelID = null;

var idLength = 4;
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

      async function startWorker(workerData) {

        // create worker object
        const worker = new Worker('./worker.js', { workerData });

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
          interval: workerData.args[2],
          status: workerData.status
        });

        message.channel.send("```css\nStarted timer " + workerData.id + " successfully!```")
        console.log(getDateTimeStr() + "Worker " + workerData.id + " started successfully!");
      }

      function doCommandFromWorker(obj) {
        if (obj.command == "say") {

          // prints a message in given channel
          message.channel.send(obj.text);

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
          console.log(getDateTimeStr() + count + "/"+allWorkers.length+" workers running!");
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



      var errors = [];

      // choose command 
      if (args[0] == "start") {

        // start worker
        if (args[1] && args[2] && args[3]) {
          await startWorker({
            id: "w" + makeID(idLength),
            status: "running",
            args
          }).catch(err => {
            console.log(err)
            errors.push(err);
          })
        } else {
          errors.push("Arguments missing!");
        }

      } else if (args[0] == "list") {

        // show cmd list in chat
        cmdList();

      } else if (args[0] == "stop") {

        if(args[1] == "all") {
          // stop all timers 
          allWorkers.forEach(el => stopWorkerById(el.id));

        } else if (args[1] && !args[2]) {
          // stop 1 timer
          stopWorkerById(args[1]);

        } else {
          errors.push("Arguments missing or wrong!");
        }
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
  }
};
