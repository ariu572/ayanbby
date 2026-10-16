const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "info",
    aliases: ["admininfo", "botinfo", "info", "ownerinfo"],
    version: "2.0",
    author: "亗🅼🅰ᥫᩣ🅼ᥫᩣ🆄🅽×͜×",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Show bot & owner information"
    },
    longDescription: {
      en: "Display detailed bot and owner information"
    },
    category: "owner",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {

    // 👑 OWNER INFO
    const authorName = "×᷼×ＭＡＭＵＮ☆";
    const ownAge = "21+";
    const messenger = "https://m.me/xdi404";
    const authorFB = "Mohammad Mamun";
    const authorNumber = "+8801830981279";
    const status = "Single";

    // 🇧🇩 BANGLADESH TIME
    const now = moment().tz("Asia/Dhaka");
    const date = now.format("DD MMMM YYYY");
    const time = now.format("hh:mm:ss A");

    // ⚡ BOT UPTIME
    const uptime = process.uptime();
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / 3600) % 24);
    const days = Math.floor(uptime / 86400);

    const uptimeString =
      `${days}d • ${hours}h • ${minutes}m • ${seconds}s`;

    const botName =
      global.GoatBot?.config?.nickNameBot || "⏤͟͟͞͞ ☻ 𝗬𝗢𝗨𝗥 𝗕𝗕𝗭 💌";

    const prefix =
      global.GoatBot?.config?.prefix || ".";

    const text = `
 🤖 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${botName}
 ⚡ 𝐏𝐫𝐞𝐟𝐢𝐱    : ${prefix}
 🟢 𝐒𝐭𝐚𝐭𝐮𝐬    : 𝐎𝐍𝐋𝐈𝐍𝐄

👑 𝐎𝐖𝐍𝐄𝐑

 💙 𝐍𝐚𝐦𝐞      : ${authorName}
 📝 𝐀𝐠𝐞       : ${ownAge}
 💕 𝐒𝐭𝐚𝐭𝐮𝐬    : ${status}
 📞 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 : ${authorNumber}
 🌍 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤  : ${authorFB}

🕐 𝐒𝐘𝐒𝐓𝐄𝐌 

 📅 𝐃𝐚𝐭𝐞      : ${date}
 ⏰ 𝐓𝐢𝐦𝐞      : ${time}
 🚀 𝐔𝐩𝐭𝐢𝐦𝐞    : ${uptimeString}

📩 𝐂𝐎𝐍𝐓𝐀𝐂𝐓 

 🔗 ${messenger}

`;

    return message.reply(text.trim());
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase().trim() === "info") {
      return this.onStart({ message });
    }
  }
};
