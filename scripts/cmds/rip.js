const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "rip",
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
      const bg = await Canvas.loadImage("https://i.imgur.com/Jh6a6hD.jpg");
      const canvas = Canvas.createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(avatar, 260, 120, 250, 250);
      ctx.drawImage(bg, 0, 0, bg.width, bg.height);
      const out = path.join(__dirname, "cache", `rip_${id}.png`);
      await fs.ensureDir(path.join(__dirname, "cache"));
      fs.writeFileSync(out, canvas.toBuffer());
      api.sendMessage({ body: "RIP 🪦", attachment: fs.createReadStream(out) }, event.threadID, () => fs.unlinkSync(out));
    } catch {}
  }
};
