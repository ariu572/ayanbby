const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "magi2",
    version: "1.0",
    author: "Mehedi-saito",
    countDown: 5,
    role: 0,
    shortDescription: "Magi meme generator",
    longDescription: "Puts profile pic on the face. If no mention/reply, picks random member.",
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
        const participants = threadInfo.participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());
        
        if (participants.length === 0) {
          return message.reply("❌ No other members found to pick randomly.");
        }
        
        targetID = participants[Math.floor(Math.random() * participants.length)];
      } catch (e) {
        return message.reply("❌ Failed to get group members. Please reply or mention someone.");
      }
    }

    try {
      const templateUrl = "https://drive.google.com/uc?export=download&id=147DOHBV1NfGBui1SqhgyWj34SDtVFNFI";

      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const [template, avatarTarget] = await Promise.all([
        loadImage(templateUrl),
        loadImage(avatarTargetUrl)
      ]);

      // Canvas size matching original image (480 x 850)
      const canvas = createCanvas(480, 850);
      const ctx = canvas.getContext("2d");

      // Draw background template
      ctx.drawImage(template, 0, 0, 480, 850);

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
        ctx.lineWidth = 5;
        ctx.stroke();
      };

      // Position of the face/phone area
      // cx = 225 (left), cy = 130 (higher), radius = 58
      const cx = 225;
      const cy = 130;
      const radius = 58;

      // Draw border then avatar
      drawCircleBorder(cx, cy, radius);
      drawAvatarInCircle(avatarTarget, cx, cy, radius);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `magi_${senderID}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      await message.reply({
        body: "Guruper magi eta 🌚🥵",
        attachment: fs.createReadStream(filePath)
      });

      fs.unlink(filePath, () => {});
    } catch (err) {
      console.error("[MAGI ERROR]", err);
      return message.reply("❌ Failed to generate the image. Please try again.");
    }
  }
};
