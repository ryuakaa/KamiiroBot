
// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"

const { workerData, parentPort } = require('worker_threads')

// get interval seconds
var timeinterval = workerData.args[2];
var updateStatusInterval = 1000; // in ms
var counter = 0;
var currentStatus = "running";

var intervalID = setInterval(() => update(parentPort), timeinterval * 1000);
var intervalStatus = setInterval(() => updateStatus(parentPort), updateStatusInterval);

/**
 * Updates every timeinterval seconds
 * @param {MessagePort} pPort 
 */
function update(pPort) {

    // if(counter >= 5)
    //     stopInterval(pPort, "Bye Bye from "+workerData.id);
    // else 
    sendResponse(pPort,"say", "Hello from worker "+workerData.id);
}

/**
 * Updates every updateStatusInterval ms 
 * @param {MessagePort} pPort 
 */
function updateStatus(pPort) {
    sendResponse(pPort, "updateStatus","Updating status of worker...");
}

/**
 * Stopps the interval 
 */
function stopInterval(pPort, message) {
    // delete interval 
    currentStatus = "stopped";
    clearInterval(intervalID);
    clearInterval(intervalStatus);
    // send stop command
    sendResponse(pPort,"stop", message);
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