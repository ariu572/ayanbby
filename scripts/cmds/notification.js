const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "3.1.2",
    author: "MAMUN",
    countDown: 10,
    role: 2,
    description: "Send a notification to all groups",
    category: "owner",
    guide: {
      en: "{pn} <message> or reply to a message with {pn}"
    },
    envConfig: {
      delayPerGroup: 500
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const senderID = event.senderID;
    let senderName = "Unknown";

    try {
      const info = await api.getUserInfo(senderID);
      senderName = info?.[senderID]?.name || "Unknown";
    } catch (error) {}

    const msgText = args.join(" ").trim();
    const attachments = [];
    const seenAttachments = new Set();

    const addAttachments = (items = []) => {
      for (const item of items) {
        if (!item) continue;

        const type = String(item.type || "").toLowerCase();

        if (
          !["photo", "animated_image", "video", "audio", "sticker"].includes(type)
        ) continue;

        const key = item.url || item.ID || item.id;

        if (key && seenAttachments.has(key)) continue;
        if (key) seenAttachments.add(key);

        attachments.push(item);
      }
    };

    addAttachments(event.attachments);
    addAttachments(event.messageReply?.attachments);

    if (!msgText && attachments.length === 0) {
      return message.reply(
        "❌ নোটিফিকেশন মেসেজ লিখো অথবা কোনো ছবি/ভিডিওতে reply দিয়ে কমান্ড দাও।\n\nউদাহরণ: -notification সবাই গ্রুপে অ্যাক্টিভ থাকো!"
      );
    }

    const notificationText = [
      "🔔 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 🔔",
      "",
      `👤 𝗦𝗘𝗡𝗧 𝗕𝗬: ${senderName}`,
      "",
      msgText
    ].filter(Boolean).join("\n");

    let attachmentStreams = [];

    try {
      if (attachments.length > 0) {
        attachmentStreams = await getStreamsFromAttachment(attachments);
      }
    } catch (error) {
      return message.reply(
        `❌ Attachment লোড করা যায়নি: ${error.message}`
      );
    }

    let threads;

    try {
      threads = await api.getThreadList(100, null, ["INBOX"]);
    } catch (error) {
      return message.reply(
        `❌ গ্রুপ লিস্ট পাওয়া যায়নি: ${error.message}`
      );
    }

    const groups = (threads || []).filter(thread => {
      if (!thread || !thread.threadID) return false;
      if (thread.isGroup === true) return true;
      if (thread.isGroup === false) return false;

      const members = thread.participantIDs || thread.participants || [];
      return members.length > 2;
    });

    if (groups.length === 0) {
      return message.reply("❌ কোনো গ্রুপ পাওয়া যায়নি।");
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    const delay = Math.max(
      0,
      Number(
        global.GoatBot?.config?.commands?.notification?.delayPerGroup ??
        module.exports.config.envConfig.delayPerGroup ??
        500
      ) || 0
    );

    for (const group of groups) {
      try {
        const payload = {
          body: notificationText
        };

        if (attachmentStreams.length > 0) {
          payload.attachment = attachmentStreams;
        }

        await new Promise((resolve, reject) => {
          api.sendMessage(payload, group.threadID, error => {
            if (error) reject(error);
            else resolve();
          });
        });

        sent++;
      } catch (error) {
        failed++;

        if (errors.length < 15) {
          errors.push(
            `${group.threadID}: ${error.message || error}`
          );
        }
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    let report =
      `✅ Notification সম্পন্ন!\n\n` +
      `📨 Sent: ${sent}\n` +
      `❌ Failed: ${failed}\n` +
      `👥 Total groups: ${groups.length}`;

    if (errors.length > 0) {
      report += `\n\n⚠️ কিছু error:\n${errors.join("\n")}`;
    }

    return message.reply(report);
  }
};
