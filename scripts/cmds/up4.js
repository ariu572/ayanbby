const os = require("os");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const CACHE_PATH = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "up4",
    version: "4.0",
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    countDown: 5,
    role: 0,
    shortDescription: "System Info",
    longDescription: "Modern glassmorphism system info card",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message }) {
    const startTime = Date.now();

    try {
      const uptimeSec = process.uptime();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const ramPercent = ((usedMem / totalMem) * 100).toFixed(0);

      const cpuLoad = (os.loadavg()[0] / os.cpus().length) * 100;
      const cpuPercent = Math.min(100, Math.max(0, cpuLoad)).toFixed(0);

      let diskPercent = 58;
      try {
        const stats = fs.statfsSync("/");
        const total = stats.blocks * stats.bsize;
        const free = stats.bfree * stats.bsize;
        diskPercent = (((total - free) / total) * 100).toFixed(0);
      } catch (e) {}

      const platform = os.platform();
      const botUptime = formatUptime(uptimeSec);
      const ping = Date.now() - startTime;

      let userName = "User";
      let avatar = null;

      try {
        const info = await api.getUserInfo(event.senderID);
        const user = info[event.senderID];
        userName = user?.name || "User";
        if (userName.length > 14) userName = userName.substring(0, 13) + "...";

        const possibleUrls = [
          user?.profileUrl,
          user?.thumbSrc,
          `https://graph.facebook.com/${event.senderID}/picture?width=512&height=512`,
          `https://graph.facebook.com/${event.senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`,
        ].filter(Boolean);

        for (const url of possibleUrls) {
          try {
            avatar = await loadImage(url);
            if (avatar) break;
          } catch (e) {}
        }
      } catch (e) {}

      // ===== Canvas =====
      const canvas = createCanvas(880, 520);
      const ctx = canvas.getContext("2d");

      // Background - Deep teal / cyan
      const bg = ctx.createLinearGradient(0, 0, 880, 520);
      bg.addColorStop(0, "#0a1628");
      bg.addColorStop(0.5, "#0d2137");
      bg.addColorStop(1, "#071525");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 880, 520);

      // Glow
      const glow = ctx.createRadialGradient(200, 180, 30, 200, 200, 380);
      glow.addColorStop(0, "rgba(6, 182, 212, 0.22)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 880, 520);

      // Main Card
      roundRect(ctx, 25, 25, 830, 470, 22);
      ctx.fillStyle = "rgba(15, 30, 50, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Title
      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "left";
      ctx.fillText("SYSTEM INFO", 55, 70);

      // Decorative line under title
      ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(55, 85);
      ctx.lineTo(280, 85);
      ctx.stroke();

      // ===== Profile Section =====
      const cx = 160;
      const cy = 200;
      const r = 62;

      if (avatar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = "#06b6d4";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Profile ring
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(userName, cx, 295);

      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 13px Arial";
      ctx.fillText("COMMAND USER", cx, 318);

      // Online badge
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(cx - 38, 345, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "13px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Online • Active", cx - 26, 349);

      // ===== Stats Cards (Right side) =====
      // CPU
      drawStatCard(ctx, 320, 110, 240, 100, "CPU", cpuPercent + "%", "#22d3ee");
      // RAM
      drawStatCard(ctx, 580, 110, 240, 100, "RAM", ramPercent + "%", "#f472b6");
      // DISK
      drawStatCard(ctx, 320, 230, 240, 100, "DISK", diskPercent + "%", "#4ade80");
      // OS
      drawStatCard(ctx, 580, 230, 240, 100, "OS", platform, "#a78bfa");

      // Bottom row
      // Uptime
      roundRect(ctx, 320, 360, 240, 100, 16);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("UPTIME", 340, 395);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.fillText(botUptime, 340, 435);

      // Ping
      roundRect(ctx, 580, 360, 240, 100, 16);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.strokeStyle = "rgba(74, 222, 128, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 14px Arial";
      ctx.fillText("PING", 600, 395);
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 28px Arial";
      ctx.fillText(ping + " ms", 600, 435);

      // Save & Send
      if (!fs.existsSync(CACHE_PATH)) fs.mkdirSync(CACHE_PATH);
      const filePath = path.join(CACHE_PATH, `up4_${event.senderID}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      await message.reply({
        body: "",
        attachment: fs.createReadStream(filePath)
      });

      setTimeout(() => fs.unlink(filePath).catch(() => {}), 15000);

    } catch (err) {
      console.error(err);
      return message.reply("❌ System Info generate করতে সমস্যা হয়েছে।");
    }
  }
};

function drawStatCard(ctx, x, y, w, h, label, value, color) {
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.strokeStyle = color + "40";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Accent bar on left
  ctx.fillStyle = color;
  roundRect(ctx, x, y, 5, h, [16, 0, 0, 16]);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 22, y + 35);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText(value, x + 22, y + 75);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = radius;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
    }
