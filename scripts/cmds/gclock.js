const LOCKED_GROUPS = {
  "4095426180772827": "🍂••◈friεnds cluβ◈••🍂",
  "27481791268097318": "ᴍᴀᴍᴜɴ ʙᴏᴛ ᴄᴏᴍᴍᴜɴɪᴛʏ ☠️",
  "1645500533902118": "ʙᴏᴛ sᴛᴜᴅᴇɴᴛ ʙᴏx 📄📂"
};

module.exports = {
  config: {
    name: "gclock",
    version: "4.1",
    author: "〲MAMUNツ࿐",
    countDown: 3,
    role: 2,
    shortDescription: "Group name lock",
    longDescription: "Silently restores configured group names",
    category: "box chat",
    guide: "{pn} status"
  },

  onStart: async function ({ api, event }) {
    const tid = String(event.threadID);
    const lockedName = LOCKED_GROUPS[tid];

    if (!lockedName) return;

    try {
      const info = await api.getThreadInfo(tid);

      if (info.threadName !== lockedName) {
        await api.setTitle(lockedName, tid);
      }

      return api.sendMessage(
        `🔒 Group Name Lock: ON\n🏷️ Group: ${lockedName}\n🆔 TID: ${tid}`,
        tid
      );
    } catch (error) {
      // Keep errors silent.
    }
  },

  onEvent: async function ({ api, event }) {
    const tid = String(event.threadID);
    const lockedName = LOCKED_GROUPS[tid];

    if (!lockedName) return;
    if (event.logMessageType !== "log:thread-name") return;

    try {
      const info = await api.getThreadInfo(tid);

      if (info.threadName !== lockedName) {
        await api.setTitle(lockedName, tid);
      }
    } catch (error) {
      // Keep errors silent.
    }
  }
};
