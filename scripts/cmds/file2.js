const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "file2",
    aliases: ["files2", "fm"],
    version: "1.3",
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Browse command files & get code by number"
    },
    longDescription: {
      en: "Show numbered list of command files. Reply with number to get the code."
    },
    category: "owner",
    guide: {
      en: "{pn}\nReply with number to get the file code"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const cmdsPath = __dirname;

    try {
      const files = fs.readdirSync(cmdsPath)
        .filter(f => f.endsWith(".js"))
        .sort();

      if (files.length === 0) {
        return api.sendMessage("❌ Kono command file paoa jayni", threadID, messageID);
      }

      let body = `📁 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗙𝗶𝗹𝗲𝘀: ${files.length}\n\n`;
      files.forEach((file, i) => {
        body += `${i + 1}. ${file}\n`;
      });
      body += `\n➤ Reply kore number din (Example: 5)`;

      api.sendMessage(body, threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID,
          files
        });
      }, messageID);

    } catch (err) {
      api.sendMessage("❌ Error: " + err.message, threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, senderID, body } = event;
    const { author, files } = Reply;

    if (senderID !== author) return;

    const number = parseInt(body.trim());

    if (isNaN(number) || number < 1 || number > files.length) {
      return api.sendMessage(`❌ Sothik number din (1 - ${files.length})`, threadID, messageID);
    }

    const fileName = files[number - 1];
    const filePath = path.join(__dirname, fileName);

    try {
      const code = fs.readFileSync(filePath, "utf8");
      const msg = `📄 𝗙𝗶𝗹𝗲: (\( {fileName})\n\n \){code}`;

      if (msg.length > 15000) {
        const chunks = msg.match(/[\s\S]{1,15000}/g) || [];
        for (const chunk of chunks) {
          await api.sendMessage(chunk, threadID);
        }
      } else {
        api.sendMessage(msg, threadID, messageID);
      }

    } catch (err) {
      api.sendMessage("❌ error content mamunp: " + err.message, threadID, messageID);
    }
  }
};
