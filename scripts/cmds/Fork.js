module.exports = {
 config: {
 name: "fork",
 version: "1.6",
 author: "⎯͢⎯⃝𝐌𝐚𝐦𝐮𝐧࿐ 모🌼💗⎯͢♡︎*",
 countDown: 2,
 role: 0,
 shortDescription: "Official GitHub Fork",
 category: "utils",
 guide: {
 en: "{pn} | fork"
 }
 },

 langs: {
 en: {
 current: `
🌐 𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗚𝗜𝗧𝗛𝗨𝗕
🔗 https://github.com/mamunx69/Goat-bot-v3.git
━━━━━━━━━━━━━
🎥 𝗩𝗜𝗗𝗘𝗢 𝗧𝗨𝗧𝗢𝗥𝗜𝗔𝗟 📺 https://youtu.be/_Qb7Pq0Xavs?si=-MaOtPPnBPVSbIFX

✦━━━━━━━━━━━✦
`
 }
 },

 onStart: async function ({ message, getLang }) {
 const link = "https://github.com/mamunx69/Goat-bot-v3.git";
 return message.reply(getLang("current", link));
 },

 onChat: async function ({ message, event, getLang }) {
 const body = event.body?.trim().toLowerCase();

 if (body === "fork") {
 const link = "https://github.com/mamunx69/Goat-bot-v3.git";
 return message.reply(getLang("current", link));
 }
 }
};
