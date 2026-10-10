const os = require("os");

module.exports = {
 config: {
 name: "up5",
 version: "2.0",
 author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
 countDown: 5,
 role: 0,
 shortDescription: "Bot uptime",
 longDescription: "Show bot uptime and system information.",
 category: "system",
 guide: "{pn}"
 },

 onStart: async function ({ message }) {
 try {
 const uptime = process.uptime();

 const days = Math.floor(uptime / 86400);
 const hours = Math.floor(uptime / 3600) % 24;
 const minutes = Math.floor(uptime / 60) % 60;
 const seconds = Math.floor(uptime) % 60;

 const totalMem = os.totalmem();
 const freeMem = os.freemem();
 const usedMem = totalMem - freeMem;

 const gb = bytes => (bytes / 1024 ** 3).toFixed(1);
 const ramPercent = ((usedMem / totalMem) * 100).toFixed(1);

 const cpu = os.cpus();
 const cpuName = cpu[0]?.model || "Unknown CPU";
 const cpuCores = cpu.length;

 const commands = global.GoatBot?.commands;
 const threads = global.GoatBot?.threads;

 const commandCount =
 typeof commands?.size === "number" ? commands.size : 0;

 const threadCount =
 typeof threads?.size === "number" ? threads.size : 0;

 const msg = `╭─────────╮
│ ⏱️ ᴜᴘᴛɪᴍᴇ
╰──────────╯

⏱️ ${days}d ${hours}h ${minutes}m ${seconds}s
ᴅᴀʏs: ${days} | ʜᴏᴜʀs: ${hours}
ᴍɪɴᴜᴛᴇs: ${minutes} | sᴇᴄᴏɴᴅs: ${seconds}

━━━━━━━━━━━━━

💻 sʏsᴛᴇᴍ
ᴄᴘᴜ: ${cpuName}
(${cpuCores} ᴄᴏʀᴇs)

ʀᴀᴍ: ${gb(usedMem)} ɢʙ / ${gb(totalMem)} ɢʙ
(${ramPercent}%)

ᴘʟᴀᴛғᴏʀᴍ: ${process.platform} ${process.arch}
ɴᴏᴅᴇ: ${process.version}

━━━━━━━━━━━━━
🧩 ᴄᴏᴍᴍᴀɴᴅs: ${commandCount}
💬 ᴛʜʀᴇᴀᴅs: ${threadCount}
`;

 return message.reply(msg);

 } catch (error) {
 console.error("up5 error:", error);
 return message.reply("❌ Failed to get system information.");
 }
 }
};
