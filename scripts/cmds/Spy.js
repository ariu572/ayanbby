
const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    version: "2.3.0",
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    role: 0,
    countDown: 5,
    shortDescription: "User profile information",
    longDescription: "Get user profile, balance, level, rank and other available information.",
    category: "utility",
    guide: {
      en: "{pn} [@mention | UID | reply | profile link]"
    }
  },

  onStart: async function ({ event, message, api, usersData, args }) {
    const {
      senderID,
      threadID,
      messageID,
      type,
      messageReply,
      mentions
    } = event;

    api.setMessageReaction(messageID, "🔍", () => {}, true);

    try {
      let targetID;

      // Reply to a message
      if (type === "message_reply" && messageReply?.senderID) {
        targetID = messageReply.senderID;
      }

      // Mention a user
      else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      }

      // UID or Facebook profile link
      else if (args[0]) {
        if (/^\d+$/.test(args[0])) {
          targetID = args[0];
        } else if (/facebook\.com/i.test(args[0])) {
          const match = args[0].match(/[?&]id=(\d+)/i);
          const directMatch = args[0].match(/\/(\d{8,})(?:\/|$)/);

          targetID = match?.[1] || directMatch?.[1];

          if (!targetID && typeof api.getUID === "function") {
            try {
              targetID = await api.getUID(args[0]);
            } catch (_) {}
          }

          if (!targetID) {
            return message.reply(
              "⚠️ Profile link থেকে UID পাওয়া যায়নি। সরাসরি UID ব্যবহার করো।"
            );
          }
        }
      }

      // Default: command sender
      if (!targetID) targetID = senderID;

      // Fetch available information
      const [userInfo, userData, allUsers, threadInfo, requesterData] =
        await Promise.all([
          new Promise((resolve, reject) => {
            api.getUserInfo(targetID, (err, info) => {
              if (err) return reject(err);
              resolve(info || {});
            });
          }),
          usersData.get(targetID).catch(() => ({})),
          usersData.getAll().catch(() => []),
          api.getThreadInfo(threadID).catch(() => ({})),
          usersData.get(senderID).catch(() => ({}))
        ]);

      const info = userInfo[targetID] || {};
      const name = info.name || "Unknown";

      // Gender normalization
      const rawGender =
        info.gender ??
        info.gender_type ??
        info.sex ??
        info.user_gender ??
        null;

      const normalizedGender = String(rawGender ?? "")
        .trim()
        .toLowerCase();

      let gender = "Not available";

      if (
        rawGender === 1 ||
        ["female", "f", "woman"].includes(normalizedGender)
      ) {
        gender = "Female";
      } else if (
        rawGender === 2 ||
        ["male", "m", "man"].includes(normalizedGender)
      ) {
        gender = "Male";
      } else if (
        ["other", "custom", "non-binary", "nonbinary"].includes(normalizedGender)
      ) {
        gender = "Other";
      }

      const isFriend =
        typeof info.isFriend === "boolean"
          ? info.isFriend ? "Yes" : "No"
          : "Not available";

      const birthday = info.isBirthday
        ? "Today 🎉"
        : "Not available";

      const location =
        info.hometown_name ||
        info.location?.name ||
        "Not available";

      const money = Number(userData?.money) || 0;
      const exp = Number(userData?.exp) || 0;
      const level = Math.floor(Math.sqrt(Math.max(0, exp)) * 0.1);

      const sorted = (Array.isArray(allUsers) ? allUsers : [])
        .filter(u => Number.isFinite(Number(u.money)))
        .sort((a, b) => Number(b.money) - Number(a.money));

      const rankIndex = sorted.findIndex(
        u => String(u.userID) === String(targetID)
      );

      const rank =
        rankIndex !== -1 ? `#${rankIndex + 1}` : "Unranked";

      const nickname =
        threadInfo?.nicknames?.[targetID] || "None";

      const requester = requesterData?.name || "Someone";

      // Public profile picture endpoint; no hard-coded token
      const avatar =
        `https://graph.facebook.com/${targetID}/picture?width=1024&height=1024&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const card = `
──────────────
  ✨ 𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗖𝗔𝗥𝗗
──────────────

👤 𝗡𝗮𝗺𝗲      : ${name}

💬 𝗡𝗶𝗰𝗸𝗻𝗮𝗺𝗲  : ${nickname}

🆔 𝗨𝗜𝗗       : ${targetID}

💰 𝗕𝗮𝗹𝗮𝗻𝗰𝗲   : $${money.toLocaleString()}

⚡ 𝗘𝗫𝗣        : ${exp.toLocaleString()}

📈 𝗟𝗲𝘃𝗲𝗹     : ${level}

🏆 𝗥𝗮𝗻𝗸      : ${rank}

⚧ 𝗚𝗲𝗻𝗱𝗲𝗿    : ${gender}

🎂 𝗕𝗶𝗿𝘁𝗵𝗱𝗮𝘆  : ${birthday}

📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻  : ${location}

🤝 𝗙𝗿𝗶𝗲𝗻𝗱    : ${isFriend}

🔗 𝗣𝗿𝗼𝗳𝗶𝗹𝗲   : https://facebook.com/${targetID}

──────────────
✨ 𝗥𝗲𝗾𝘂𝗲𝘀𝘁𝗲𝗱 𝗯𝘆 : ${requester}
`;

      // Send profile card; image failure won't block the text
      try {
        const stream = await global.utils.getStreamFromURL(avatar);

        await message.reply({
          body: card,
          attachment: stream
        });
      } catch (imageError) {
        console.error("[spy] Avatar error:", imageError.message);
        await message.reply(card);
      }

      api.setMessageReaction(messageID, "✅", () => {}, true);

    } catch (err) {
      console.error("[spy] Error:", err);

      api.setMessageReaction(messageID, "❌", () => {}, true);

      return message.reply(
        "⚠️ User information পাওয়া যায়নি। UID সঠিক কি না যাচাই করে আবার চেষ্টা করো।"
      );
    }
  }
};
        
