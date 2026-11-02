const os = require("os");
const pidusage = require("pidusage");
const { execSync } = require("child_process");

module.exports = {
  config: {
    name: "rtm",
    version: "1.7",
    author: "Ariyan bb'z",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Show system & bot stats" },
    longDescription: { en: "Display CPU, RAM, disk usage, uptime, users, groups etc." },
    category: "system"
  },
  onStart: async function ({ message, api, event, threadsData, usersData, commands }) {
    let sent;
    try {
      sent = await message.reply(">🎀 𝐋𝐨𝐚𝐝𝐢𝐧𝐠..");

      const frames = [
        "a",
        "ar",
        "ari",
        "ariY",
        "ariYa",
        "ariYa'n",
        "ariYa'n b",
        "ariYa'n bb",
        "ariYa'n bb'z",
        "ariYa'n bb'z r",
        "ariYa'n bb'z rt",
        "ariYa'n bb'z rtm"
      ];

      for (let i = 0; i < frames.length; i++) {
        await new Promise(r => setTimeout(r, 180));
        await api.editMessage(`>🎀 ${frames[i]}`, sent.messageID);
      }

      // CPU & Memory usage
      const stats = await pidusage(process.pid);
      const cpuUsage = stats.cpu.toFixed(2);
      const usedMem = stats.memory / 1024 / 1024;
      const totalMem = os.totalmem() / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024;

      // Disk usage
      let diskTotal = 0, diskUsed = 0, diskFree = 0;
      try {
        const df = execSync("df -k --total").toString().split("\n");
        const totalLine = df[df.length - 2].trim().split(/\s+/);
        diskTotal = (parseInt(totalLine[1]) / 1024 / 1024).toFixed(2);
        diskUsed = (parseInt(totalLine[2]) / 1024 / 1024).toFixed(2);
        diskFree = (parseInt(totalLine[3]) / 1024 / 1024).toFixed(2);
      } catch {
        diskTotal = totalMem.toFixed(2);
        diskUsed = usedMem
