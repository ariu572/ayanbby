module.exports = {
  config: {
    name: "tag",
    aliases: [],
    category: "GROUP",
    role: 0,
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    countDown: 3,
    description: {
      en: "Tag by reply, name or tag all members"
    },
    guide: {
      en: "{pn}tag [name] [msg]\n{pn}tag all [msg]\nReply + {pn}tag [msg]"
    }
  },

  onStart: async ({ api, event, usersData, threadsData, args }) => {
    const { threadID, messageID, messageReply } = event;

    try {
      const threadData = await threadsData.get(threadID);

      const members = threadData.members
        .filter(m => m.inGroup === true)
        .map(m => ({
          name: m.name,
          id: m.userID
        }));

      let tagUsers = [];
      let text = "";

      // 1. Reply kore tag
      if (messageReply) {
        const uid = messageReply.senderID;
        const name = await usersData.getName(uid);
        tagUsers.push({ name, id: uid });
        text = args.join(" ");
      }

      // 2. All / everyone
      else if (args[0] && ["all", "everyone", "cdi"].includes(args[0].toLowerCase())) {
        tagUsers = members;
        text = args.slice(1).join(" ");
      }

      // 3. Name diye search
      else {
        if (!args[0]) {
          return api.sendMessage(
            "⚠️ Name / reply / tag all",
            threadID,
            messageID
          );
        }

        const searchName = args[0].toLowerCase();
        text = args.slice(1).join(" ");

        tagUsers = members.filter(m =>
          m.name.toLowerCase().includes(searchName)
        );

        if (tagUsers.length === 0) {
          return api.sendMessage("❌ User Not Found", threadID, messageID);
        }
      }

      // Mentions create
      const mentions = [];
      let body = "";

      tagUsers.forEach((u, index) => {
        body += `@${u.name}`;
        if (index < tagUsers.length - 1) body += ", ";
        mentions.push({
          tag: `@${u.name}`,
          id: u.id
        });
      });

      if (text) body += `\n${text}`;

      api.sendMessage(
        {
          body: body,
          mentions: mentions
        },
        threadID,
        messageReply ? messageReply.messageID : messageID
      );

    } catch (err) {
      api.sendMessage("❌ Error: " + err.message, threadID, messageID);
    }
  }
};
