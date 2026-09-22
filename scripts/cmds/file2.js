const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "file2",
    aliases: ["files2", "getfile"],
    version: "1.0",
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Show all command files & get code by number"
    },
    longDescription: {
      en: "List all command files with number, reply with number to get the code"
    },
    category: "owner",
    guide: {
      en: "{pn}\n{pn} <command name>\nReply: <number>\nReply: <number> raw\nReply: <number> text"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;
    const cmdsPath = path.join(__dirname);

    try {
      // Direct command name dile
      if (args[0]) {
        const cmdName = args[0].toLowerCase().replace(/\.js$/, "");
        const filePath = path.join(cmdsPath, cmdName + ".js");

        if (!fs.existsSync(filePath)) {
          return api.sendMessage(`❌ "${cmdName}.js" file paoa jayni`, threadID, messageID);
        }

        const code = fs.readFileSync(filePath, "utf8");
        return api.sendMessage(`📄 File: \( {cmdName}.js\n\n \){code}`, threadID, messageID);
      }

      // List banano
      const files = fs.readdirSync(cmdsPath)
        .filter(file => file.endsWith(".js"))
        .sort();

      if (files.length === 0) {
        return api.sendMessage("❌ Kono command file paoa jayni", threadID, messageID);
      }

      let body = `📁 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗙𝗶𝗹𝗲𝘀: ${files.length}\n\n`;
      files.forEach((file, index) => {
        body += `${index + 1}. ${file}\n`;
      });

      body += `\n➤ Reply kore number din (Example: 5)\n➤ Extra option: 5 raw  |  5 text`;

      api.sendMessage(body, threadID, (err, info) => {
        if (err) return;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID,
          files: files
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

    const args = body.trim().split(/\s+/);
    const number = parseInt(args[0]);
    const type = (args[1] || "").toLowerCase();

    if (isNaN(number) || number < 1 || number > files.length) {
      return api.sendMessage(`❌ Sothik number din (1 - ${files.length})`, threadID, messageID);
    }

    const fileName = files[number - 1];
    const filePath = path.join(__dirname, fileName);

    try {
      const code = fs.readFileSync(filePath, "utf8");

      let msg = "";

      if (type === "raw") {
        msg = code; // pure raw code
      } 
      else if (type === "text") {
        msg = `📄 𝗙𝗶𝗹𝗲: \( {fileName}\n\n \){code}`;
      } 
      else {
        msg = `📄 𝗙𝗶𝗹𝗲: \( {fileName}\n\n \){code}`;
      }

      // Code too long hole split kore pathabe
      if (msg.length > 15000) {
        const chunks = msg.match(/[\s\S]{1,15000}/g) || [];
        for (const chunk of chunks) {
          await api.sendMessage(chunk, threadID);
        }
      } else {
        api.sendMessage(msg, threadID, messageID);
      }

    } catch (err) {
      api.sendMessage("❌ File porte problem: " + err.message, threadID, messageID);
    }
  }
};
