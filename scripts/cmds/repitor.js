module.exports = {
  config: {
    name: "repitor",
    aliases: ["repeat", "rp", "rep"],
    version: "1.2",
    author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Repeat text or emoji",
      bn: "টেক্সট বা ইমোজি রিপিট করে"
    },
    description: {
      en: "Repeat any text or emoji",
      bn: "যেকোনো টেক্সট বা ইমোজি রিপিট করে"
    },
    category: "fun",
    guide: {
      en: "{pn} <number> <text/emoji>\nExample: {pn} 20 😘🎀",
      bn: "{pn} <সংখ্যা> <টেক্সট/ইমোজি>\nউদাহরণ: {pn} 20 😘🎀"
    }
  },

  onStart: async function ({ message, args }) {
    if (args.length < 2) {
      return message.reply("repitor <number> <text/emoji>");
    }

    const count = parseInt(args[0]);
    const text = args.slice(1).join(" ");

    if (isNaN(count) || count < 1) {
      return message.reply("Invalid number");
    }

    if (count > 500) {
      return message.reply("Max 500");
    }

    return message.reply(text.repeat(count));
  }
};
