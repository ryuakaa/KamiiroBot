const conf = require("./../../conf/confBot");
const axios = require("axios");
const moment = require("moment");

module.exports = {
  name: "get",
  category: "youtube",
  description: "GETs data from youtube api",
  usage: "<id>",
  run: async (client, message, args) => {
    try {
      let res = await getChannelInfo(conf.julie.channelid, "live");

      sendStreamNotification(message, res);
    } catch (error) {
      console.log(error.toString());
      message.channel.send(error.toString());
    }
  }
};

