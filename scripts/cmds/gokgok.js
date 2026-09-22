const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gokgok",
    version: "1.0",
    author: "Mehedi-saito",
    countDown: 5,
    role: 0,
    shortDescription: "Gokgok meme generator",
    longDescription: "Sender on standing face, target/random on sitting face",
    category: "fun",
    guide: {
      en: "{pn} reply/mention someone OR just type {pn} for random"
    }
  },

  onStart: async function ({ api, event, usersData, message }) {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;

    let targetID;

    // Priority: reply > mention > random
    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      // Random member from the group
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const participants = threadInfo.participantIDs.filter(
          id => id !== senderID && id !== api.getCurrentUserID()
        );

        if (participants.length === 0) {
          return message.reply("❌ No other members found to pick randomly.");
        }

        targetID = participants[Math.floor(Math.random() * participants.length)];
      } catch (e) {
        return message.reply("❌ Failed to get group members. Please reply or mention someone.");
      }
    }

    try {
      const templateUrl = "https://drive.google.com/uc?export=download&id=1tV0uZ2yLwzdTr4eU4qKGwn9bnjDUYSTX";

      // Sender (command user) → standing person
      const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // Target (replied/mentioned/random) → sitting person
      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const [template, avatarSender, avatarTarget] = await Promise.all([
        loadImage(templateUrl),
        loadImage(avatarSenderUrl),
        loadImage(avatarTargetUrl)
      ]);

      // Canvas size matching original image (480 x 488)
      const canvas = createCanvas(480, 488);
      const ctx = canvas.getContext("2d");

      // Draw background template
      ctx.drawImage(template, 0, 0, 480, 488);

      // Draw avatar in circle function
      const drawAvatarInCircle = (img, cx, cy, radius) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          img,
          cx - radius,
          cy - radius,
          radius * 2,
          radius * 2
        );
        ctx.restore();
      };

      // White border around avatar
      const drawCircleBorder = (cx, cy, radius) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;
        ctx.stroke();
      };

      // Standing person face → Sender (command user) - slightly more right
      const standingCx = 335;
      const standingCy = 85;
      const standingRadius = 82;

      // Sitting person face → Target (replied/mentioned/random) - slightly smaller
      const sittingCx = 120;
      const sittingCy = 370;
      const sittingRadius = 78;

      // Draw sender on standing face
      drawCircleBorder(standingCx, standingCy, standingRadius);
      drawAvatarInCircle(avatarSender, standingCx, standingCy, standingRadius);

      // Draw target on sitting face
      drawCircleBorder(sittingCx, sittingCy, sittingRadius);
      drawAvatarInCircle(avatarTarget, sittingCx, sittingCy, sittingRadius);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `gokgok_${senderID}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      await message.reply({
        body: "gruruper sobar samne gokgok korlam magi ke 🌚🥵🍼",
        attachment: fs.createReadStream(filePath)
      });

      fs.unlink(filePath, () => {});
    } catch (err) {
      console.error("[GOKGOK ERROR]", err);
      return message.reply("❌ Failed to generate the image. Please try again.");
    }
  }
};
