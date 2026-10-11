const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "pp",
    version: "2.5.0",
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    countDown: 3,
    role: 0,
    shortDescription: "View Facebook profile picture 📸",
    longDescription: "Get the profile picture of any user by reply, mention, UID, or profile link.",
    category: "media",
    guide: {
      en: "{pn} [reply / @mention / UID / profile link]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    let uids = [];

    if (event.type === "message_reply") {
      uids.push(event.messageReply.senderID);
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      uids = Object.keys(event.mentions);
    } else if (args[0] && args[0].includes("facebook.com")) {
      try {
        const uid = await api.getUID(args[0]);
        uids.push(uid);
      } catch (e) {
        return api.sendMessage("⚠️ 𝙄𝙣𝙫𝙖𝙡𝙞𝙙 𝙁𝙖𝙘𝙚𝙗𝙤𝙤𝙠 𝙥𝙧𝙤𝙛𝙞𝙡𝙚 𝙡𝙞𝙣𝙠\~", event.threadID, event.messageID);
      }
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uids.push(args[0]);
    } else {
      uids.push(event.senderID);
    }

    uids = [...new Set(uids)].slice(0, 5);

    const attachments = [];
    const names = [];

    for (const uid of uids) {
      try {
        const name = await usersData.getName(uid).catch(() => "Unknown User");
        names.push(name);

        const imageUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 15000
        });

        const filePath = path.join(cacheDir, `pp_\( {uid}_ \){Date.now()}.jpg`);
        await fs.writeFile(filePath, response.data);
        attachments.push(fs.createReadStream(filePath));
      } catch (err) {
        console.error(`[pp] Failed to get picture of ${uid}:`, err.message);
      }
    }

    if (attachments.length === 0) {
      return api.sendMessage("⚠️ 𝙁𝙖𝙞𝙡𝙚𝙙 𝙩𝙤 𝙛𝙚𝙩𝙘𝙝 𝙖𝙣𝙮 𝙥𝙧𝙤𝙛𝙞𝙡𝙚 𝙥𝙞𝙘𝙩𝙪𝙧𝙚\~", event.threadID, event.messageID);
    }

    let body = "";

    if (attachments.length === 1) {
      body = `✧･ﾟ:✧ 𝑷𝒓𝒐𝒇𝒊𝒍𝒆 𝑷𝒊𝒄𝒕𝒖𝒓𝒆 ✧:･ﾟ✧\n\n🌸 𝑵𝒂𝒎𝒆 › ${names[0]}`;
    } else {
      body = `✧･ﾟ:* 𝑷𝒓𝒐𝒇𝒊𝒍𝒆 𝑷𝒊𝒄𝒕𝒖𝒓𝒆𝒔 *:･ﾟ✧\n\n` + 
        names.map((n, i) => `🌸 ${i + 1}. ${n}`).join("\n");
    }

    api.sendMessage(
      {
        body,
        attachment: attachments
      },
      event.threadID,
      async () => {
        for (const stream of attachments) {
          try {
            await fs.remove(stream.path);
          } catch (e) {}
        }
      },
      event.messageID
    );
  }
};
