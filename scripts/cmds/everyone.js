module.exports = {
  config: {
    name: "everyone",
    aliases: ["every", "alltag"],
    version: "1.0.0",
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    countDown: 10,
    role: 2, // 2 = শুধু Bot Admin ব্যবহার করতে পারবে
    shortDescription: {
      en: "Mention everyone multiple times (1-50)"
    },
    longDescription: {
      en: "Send @everyone style mention multiple times in the group (1 to 50 times)"
    },
    category: "box chat",
    guide: {
      en: "{pn} [1-50]\nExample: {pn} 10"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, participantIDs } = event;

    let times = parseInt(args[0]);
    if (isNaN(times) || times < 1 || times > 50) {
      return message.reply("❌ দয়া করে 1 থেকে 50 এর মধ্যে একটি সংখ্যা দাও!\nউদাহরণ: everyone 10");
    }

    const mentions = [];
    let body = "@everyone ";
    let i = 0;

    for (const uid of participantIDs) {
      if (body.length < participantIDs.length) {
        body += "a";
      }
      mentions.push({
        tag: body[i] || " ",
        id: uid,
        fromIndex: i
      });
      i++;
    }

    message.reply(`✅ ${times} বার everyone mention শুরু হচ্ছে...`);

    for (let t = 1; t <= times; t++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      api.sendMessage({
        body: body,
        mentions
      }, threadID);
    }

    message.reply(` ${times} বার everyone mention করা হয়েছে।\nAuthor: 𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷`);
  }
};
