const { drive } = global.utils;
const { nickNameBot } = global.GoatBot.config;
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "welcome",
    version: "9.0",
    author: "Mamun",
    category: "events"
  },

  langs: {
    en: {
      defaultWelcomeMessage: "🌸 Welcome {userName}!\n\n💙 Glad to have you here. Enjoy your stay and make great memories ✨",
      botAddedMessage: "Thanks for adding me!\nUse -help to see all commands.\n\n✦ Powered by Mamun"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData.settings.sendWelcomeMessage) return;

    const addedMembers = event.logMessageData.addedParticipants;
    const threadName = threadData.threadName || "our group";
    const prefix = global.utils.getPrefix(threadID);
    const inviterID = event.author;

    for (const user of addedMembers) {
      const userID = user.userFbId;
      const botID = api.getCurrentUserID();

      if (userID == botID) {
        if (nickNameBot) await api.changeNickname(nickNameBot, threadID, botID);
        return message.send(getLang("botAddedMessage", prefix));
      }

      const userName = user.fullName || "Someone";
      const inviterName = await usersData.getName(inviterID).catch(() => "Someone");
      const memberCount = event.participantIDs.length;

      let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
      welcomeMessage = welcomeMessage
        .replace(/\{userName\}/g, userName)
        .replace(/\{userTag\}/g, userName)
        .replace(/\{threadName\}/g, threadName)
        .replace(/\{memberCount\}/g, memberCount)
        .replace(/\{inviterName\}/g, inviterName);

      let welcomeImagePath = null;
      try {
        welcomeImagePath = await createWelcomeCard({
          userName,
          threadName,
          memberCount,
          inviterName,
          newUserID: userID,
          inviterID,
          threadID,
          api
        });
      } catch (err) {
        console.error("Welcome image creation failed:", err);
      }

      const form = {
        body: welcomeMessage,
        mentions: [{ tag: userName, id: userID }]
      };

      if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
        form.attachment = fs.createReadStream(welcomeImagePath);
      } else if (threadData.data.welcomeAttachment) {
        const attachments = threadData.data.welcomeAttachment
          .map(f => drive.getFile(f, "stream"));
        form.attachment = (await Promise.allSettled(attachments))
          .filter(({ status }) => status === "fulfilled")
          .map(({ value }) => value);
      }

      message.send(form);

      if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
        setTimeout(() => {
          try { fs.unlinkSync(welcomeImagePath); } catch (_) {}
        }, 5000);
      }
    }
  }
};

const ACCESS_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde566";

async function downloadHighQualityProfile(userID) {
  try {
    const url = `https://graph.facebook.com/${userID}/picture?width=500&height=500&access_token=${ACCESS_TOKEN}`;
    const res = await axios({
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function createWelcomeCard({
  userName,
  threadName,
  memberCount,
  inviterName,
  newUserID,
  inviterID,
  threadID,
  api
}) {
  const canvas = createCanvas(1100, 520);
  const ctx = canvas.getContext("2d");

  // ===== Dark Blue Background =====
  const bg = ctx.createRadialGradient(550, 260, 50, 550, 260, 700);
  bg.addColorStop(0, "#0a1628");
  bg.addColorStop(0.5, "#07101c");
  bg.addColorStop(1, "#040a12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1100, 520);

  // Faint background text
  ctx.globalAlpha = 0.05;
  ctx.font = "bold 160px Arial";
  ctx.fillStyle = "#3b82f6";
  ctx.textAlign = "center";
  ctx.fillText("WELCOME", 550, 310);
  ctx.globalAlpha = 1;

  // ===== Left Card =====
  ctx.fillStyle = "rgba(10, 20, 40, 0.9)";
  roundRect(ctx, 40, 40, 340, 440, 28);
  ctx.fill();

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#3b82f6";
  ctx.shadowBlur = 18;
  roundRect(ctx, 40, 40, 340, 440, 28);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Avatar
  const avatarSize = 210;
  const avatarX = 210;
  const avatarY = 200;

  try {
    const buf = await downloadHighQualityProfile(newUserID);
    if (buf) {
      const avatar = await loadImage(buf);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    } else {
      ctx.fillStyle = "#0f1c2e";
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } catch {
    ctx.fillStyle = "#0f1c2e";
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blue ring
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 6;
  ctx.shadowColor = "#3b82f6";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Developer: Mamun
  ctx.font = "bold 20px Arial";
  ctx.fillStyle = "#93c5fd";
  ctx.textAlign = "center";
  ctx.fillText("💻 Developer: Mamun", 210, 380);

  // ===== Right Side =====
  ctx.textAlign = "left";
  ctx.font = "bold 58px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(59, 130, 246, 0.45)";
  ctx.shadowBlur = 12;
  ctx.fillText("WELCOME", 430, 110);
  ctx.shadowBlur = 0;

  // Username
  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "#f1f5f9";
  let displayName = userName;
  if (ctx.measureText(displayName).width > 520) {
    while (ctx.measureText(displayName + "...").width > 520) {
      displayName = displayName.slice(0, -1);
    }
    displayName += "...";
  }
  ctx.fillText(displayName, 430, 165);

  // Status box
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  roundRect(ctx, 430, 195, 520, 55, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 430, 195, 520, 55, 14);
  ctx.stroke();

  ctx.font = "22px Arial";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText("💙  Joined the group successfully!", 455, 230);

  // Binary box
  ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
  roundRect(ctx, 430, 270, 520, 50, 12);
  ctx.fill();

  ctx.font = "15px monospace";
  ctx.fillStyle = "#93c5fd";
  ctx.globalAlpha = 0.9;
  ctx.fillText("01F 01F 01F 01F 01F 01F 01F 01F 01F 01F 01F ...", 450, 302);
  ctx.globalAlpha = 1;

  // Members pill
  ctx.fillStyle = "#3b82f6";
  roundRect(ctx, 430, 350, 200, 55, 14);
  ctx.fill();

  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(`👤  ${memberCount} MEMBERS`, 530, 385);

  // Time pill
  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  roundRect(ctx, 650, 350, 300, 55, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 650, 350, 300, 55, 14);
  ctx.stroke();

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  ctx.font = "18px Arial";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`🕒  ${timeStr}  ·  ${dateStr}`, 800, 385);

  // Powered by Mamun
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText("✦ Powered by Mamun", 430, 460);

  const tempPath = path.join(__dirname, `temp_welcome_${Date.now()}.png`);
  await fs.writeFile(tempPath, canvas.toBuffer("image/png"));
  return tempPath;
}
