module.exports = {
  config: {
    name: "out",
    version: "3.1",
    author: "𝐌𝐀𝐌𝐔𝐍_ author cng korle tor ammu ke xudi",
    countDown: 5,
    role: 0,
    shortDescription: "𝐁𝐨𝐭 𝐋𝐞𝐚𝐯𝐞 𝐆𝐫𝐨𝐮𝐩",
    longDescription: "𝐎𝐧𝐥𝐲 𝐎𝐰𝐧𝐞𝐫 (𝐌𝐀𝐌𝐔𝐍) 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.",
    category: "owner",
    guide: {
      en: "{pn} [threadID]"
    }
  },

  onStart: async function ({ api, event, args }) {
    const OWNER_IDS = [
      "61595057655929",
      "61595489399118"
    ];

    if (!OWNER_IDS.includes(event.senderID)) {
      return api.sendMessage(
` 🚫 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭
 𝐚𝐮𝐭𝐡𝐨𝐫𝐢𝐳𝐞𝐝.`,
        event.threadID
      );
    }

    const threadID = args[0] || event.threadID;
    const botID = api.getCurrentUserID();

    api.sendMessage(
` 🥹 𝐁𝐨𝐭 𝐢𝐬 𝐥𝐞𝐚𝐯𝐢𝐧𝐠...
 💖 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮!
 👑 𝐎𝐰𝐧𝐞𝐫 : 𝐌𝐀𝐌𝐔𝐍 💌`,
      threadID,
      () => {
        setTimeout(() => {
          api.removeUserFromGroup(botID, threadID, (err) => {
            if (err) {
              console.error(err);
              return api.sendMessage(
` ❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐥𝐞𝐚𝐯𝐞.
`,
                event.threadID
              );
            }
          });
        }, 1000);
      }
    );
  }
};
