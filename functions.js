module.exports = {
  getMember(message, toFind = "") {
    toFind = toFind.toLowerCase();

    let target = message.guild.members.get(toFind);
    if (!target && message.mentions.members)
      target = message.mentions.members.first();

    if (!target && toFind) {
      target = message.guild.members.find(member => {
        return (
          member.displayName.toLowerCase().includes(toFind) ||
          member.user.tag.toLowerCase().includes(toFind)
        );
      });
    }
    if (!target) target = message.member;

    return target;
  },

  formatDate: date => {
    return new Intl.DateTimeFormat("en-US").format(date);
  },

  /**
   * Returns response data from channel
   * @param {String} channelid
   * @param {String} eventType
   * @returns {Object}
   */
  async getStatus(channelid, eventType) {
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
  },

  /**
   * Returns Channel info
   * @param {*} channelId id
   * @param {*} eventType live, completed, etc
   * @returns {Object} returns json [item]
   */
  async getChannelInfo(channelId, eventType) {
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
      console.log(error);
      return error;
    }
  },

  /**
   * sends message in channel
   * @param {*} msg on message
   * @param {*} res yt response
   */
  getStreamNotification(msg, res) {
    // get data from youtube api
    let item = res.items[0];
    let img = item.snippet.thumbnails.high.url;
    let url = "https://youtube.com/watch?v=" + item.id.videoId;

    if (res.pageInfo.totalResults === 0) {
      msg.channel.send("This channel is offline!");
      return;
    }

    msg.channel.send(
      "Hi @here, **" +
        item.snippet.channelTitle +
        "** ist ab jetzt live auf YouTube!\n" +
        url
    );
  }
};
