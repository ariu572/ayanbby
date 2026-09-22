const fs = require('fs');

module.exports = {
	config: {
		name: "file",
		aliases: ["📂"],
		version: "1.0",
		author: "〲MAMUNツ࿐",
		countDown: 5,
		role: 0,
		shortDescription: "Send bot script",
		longDescription: "Send bot specified file ",
		category: "𝗢𝗪𝗡𝗘𝗥",
		guide: "{pn} file name. Ex: .{pn} filename"
	},

	onStart: async function ({ message, args, api, event }) {
		const permission = ["61593818074328", "61594650721376", "61594262259855", "61590625333095" ,];
		if (!permission.includes(event.senderID)) {
			return api.sendMessage("𝙠𝙝𝙖𝙣𝙠𝙞𝙧 𝙘𝙝𝙚𝙡𝙚 𝙟𝙖 𝙫𝙖𝙜𝙜𝙜 𝙗𝙤𝙩 𝙠𝙞 𝙩𝙤𝙧 𝙗𝙖𝙥𝙚𝙧 🥵💦", event.threadID, event.messageID);
		}

		const fileName = args[0];
		if (!fileName) {
			return api.sendMessage("Please provide a file name.", event.threadID, event.messageID);
		}

		const filePath = __dirname + `/${fileName}.js`;
		if (!fs.existsSync(filePath)) {
			return api.sendMessage(`File not found: ${fileName}.js`, event.threadID, event.messageID);
		}

		const fileContent = fs.readFileSync(filePath, 'utf8');
		api.sendMessage({ body: fileContent }, event.threadID);
	}
};
