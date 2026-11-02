const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bukacuda",
    version: "1.0",
    author: "ariYa'n",
    countDown: 5,
    role: 0,
    category: "fun",
    guide: "{pn} @mention"
  },
  onStart: async function ({ api, event }) {
    const id = Object.keys(event.mentions)[0] || event.senderID;
    try {
      const avatar = await Canvas.loadImage(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
      const canvas = Canvas.createCanvas(800, 900);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(avatar, 0, 0, 800, 800);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 750, 800, 150);
      ctx.fillStyle = "yellow";
      ctx.font = "bold 65px Arial";
      ctx.fillText("BUKACUDA", 230, 850);
      const out = path.join(__dirname, "cache", `buka_${id}.png`);
      await fs.ensureDir(path.join(__dirname, "cache"));
      fs.writeFileSync(out, canvas.toBuffer());
      api.sendMessage({ body: "Bukacuda spotted 😂", attachment: fs.createReadStream(out) }, event.threadID, () => fs.unlinkSync(out));
    } catch {}
  }
};
