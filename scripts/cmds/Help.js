const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const small = {
	A:"ᴀ",B:"ʙ",C:"ᴄ",D:"ᴅ",E:"ᴇ",F:"ꜰ",G:"ɢ",H:"ʜ",I:"ɪ",J:"ᴊ",K:"ᴋ",L:"ʟ",M:"ᴍ",
	N:"ɴ",O:"ᴏ",P:"ᴘ",Q:"ǫ",R:"ʀ",S:"ꜱ",T:"ᴛ",U:"ᴜ",V:"ᴠ",W:"ᴡ",X:"x",Y:"ʏ",Z:"ᴢ",
	a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",
	n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"ꜱ",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ"
};

const bold = {
	A:"𝗔",B:"𝗕",C:"𝗖",D:"𝗗",E:"𝗘",F:"𝗙",G:"𝗚",H:"𝗛",I:"𝗜",J:"𝗝",K:"𝗞",L:"𝗟",M:"𝗠",
	N:"𝗡",O:"𝗢",P:"𝗣",Q:"𝗤",R:"𝗥",S:"𝗦",T:"𝗧",U:"𝗨",V:"𝗩",W:"𝗪",X:"𝗫",Y:"𝗬",Z:"𝗭",
	a:"𝗮",b:"𝗯",c:"𝗰",d:"𝗱",e:"𝗲",f:"𝗳",g:"𝗴",h:"𝗵",i:"𝗶",j:"𝗷",k:"𝗸",l:"𝗹",m:"𝗺",
	n:"𝗻",o:"𝗼",p:"𝗽",q:"𝗾",r:"𝗿",s:"𝘀",t:"𝘁",u:"𝘂",v:"𝘃",w:"𝘄",x:"𝘅",y:"𝘆",z:"𝘇",
	"0":"𝟬","1":"𝟭","2":"𝟮","3":"𝟯","4":"𝟰","5":"𝟱","6":"𝟲","7":"𝟳","8":"𝟴","9":"𝟵"
};

function toSmall(text) {
	return String(text == null ? "" : text).split("").map(function (ch) {
		return small[ch] || ch;
	}).join("");
}

function toBold(text) {
	return String(text == null ? "" : text).split("").map(function (ch) {
		return bold[ch] || ch;
	}).join("");
}

module.exports = {
	config: {
		name: "help",
		version: "3.7",
		author: "𝗧𝗠 ^〲𝗠𝗔𝗠𝗨𝗡ツ࿐ ⁰⁰⁷",
		countDown: 5,
		role: 0,
		shortDescription: "See all commands",
		longDescription: "See all commands with reaction pages",
		category: "info",
		guide: "{pn}\n{pn} <cmd>"
	},

	onStart: async function ({ message, args, event, role }) {
		const prefix = getPrefix(event.threadID);
		const input = (args[0] || "").toLowerCase();

		if (input && isNaN(input)) {
			const cmd = commands.get(input) || commands.get(aliases.get(input));
			if (!cmd) return message.reply(toBold("Command") + " \"" + input + "\" " + toBold("not found"));
			const need = Number(cmd.config.role || 0);
			if (need > 1 && role < need) return message.reply(toBold("Command") + " \"" + input + "\" " + toBold("not found"));

			const d = cmd.config.description;
			const desc = !d ? "No description" : typeof d === "string" ? d : (d.en || d.bn || "No description");
			let guide = cmd.config.guide;
			if (!guide) guide = prefix + cmd.config.name;
			else if (typeof guide === "object") guide = guide.en || guide.bn || Object.values(guide)[0];
			guide = String(guide).replace(/{pn}|{p}/g, prefix + cmd.config.name);

			const als = (cmd.config.aliases && cmd.config.aliases.length) ? cmd.config.aliases.join(", ") : "None";
			const r = Number(cmd.config.role || 0);
			let roleText = r + " (All users)";
			if (r === 1) roleText = "1 (Group admin)";
			else if (r === 2) roleText = "2 (Bot admin)";
			else if (r >= 3) roleText = r + " (Owner)";

			const text =
				"╭─────────⭓\n" +
				"│ 🎀 " + toBold("NAME") + ": " + toSmall(cmd.config.name) + "\n" +
				"│ 📃 " + toBold("Aliases") + ": " + toSmall(als) + "\n" +
				"├──‣ " + toBold("INFO") + "\n" +
				"│ 📝 " + toBold("Description") + ": " + toBold(desc) + "\n" +
				"│ 👑 " + toBold("Author") + ": " + (cmd.config.author || "Unknown") + "\n" +
				"│ 📚 " + toBold("Guide") + ": " + toBold(guide.replace(/\n/g, " | ")) + "\n" +
				"├──‣ " + toBold("Details") + "\n" +
				"│ ⭐ " + toBold("Version") + ": " + toBold(cmd.config.version || "1.0") + "\n" +
				"│ ♻️ " + toBold("Role") + ": " + toBold(roleText) + "\n" +
				"╰────────────⭓";
			return message.reply(text);
		}

		const pages = buildPages(role);
		const page = Math.min(3, Math.max(1, parseInt(input) || 1));
		const body = renderPage(pages, page, prefix);

		return message.reply(body, function (err, info) {
			if (err || !info) return;
			global.GoatBot.onReaction.set(info.messageID, {
				commandName: "help",
				messageID: info.messageID,
				author: event.senderID,
				page: page,
				role: role
			});
		});
	},

	onReaction: async function ({ message, event, Reaction }) {
		if (String(event.userID) !== String(Reaction.author)) return;

		let page = Number(Reaction.page) || 1;
		page = page >= 3 ? 1 : page + 1;

		const prefix = getPrefix(event.threadID);
		const pages = buildPages(Reaction.role);
		const body = renderPage(pages, page, prefix);

		try { await message.unsend(Reaction.messageID); } catch (e) {}

		return message.reply(body, function (err, info) {
			if (err || !info) return;
			global.GoatBot.onReaction.set(info.messageID, {
				commandName: "help",
				messageID: info.messageID,
				author: Reaction.author,
				page: page,
				role: Reaction.role
			});
		});
	}
};

function buildPages(role) {
	const groups = {};

	for (const [key, cmd] of commands) {
		if (!cmd || !cmd.config) continue;
		const need = Number(cmd.config.role || 0);
		if (need > 1 && role < need) continue;

		const cmdName = cmd.config.name || key;
		const cat = String(cmd.config.category || "other").trim().toUpperCase();

		if (!groups[cat]) groups[cat] = [];
		if (groups[cat].indexOf(cmdName) === -1) groups[cat].push(cmdName);
	}

	const boxes = [];
	const cats = Object.keys(groups).sort();

	for (let c = 0; c < cats.length; c++) {
		const cat = cats[c];
		const list = groups[cat].sort();
		const rows = [];

		for (let i = 0; i < list.length; i += 3) {
			const part = list.slice(i, i + 3);
			let row = "│";
			for (let j = 0; j < part.length; j++) {
				row += " ✧" + toSmall(part[j]);
			}
			rows.push(row);
		}

		boxes.push(
			"╭─────⭓ " + toBold(cat) + "\n" +
			rows.join("\n") + "\n" +
			"╰────────────⭓"
		);
	}

	const size = Math.ceil(boxes.length / 3) || 1;
	return [
		boxes.slice(0, size),
		boxes.slice(size, size * 2),
		boxes.slice(size * 2)
	];
}

function renderPage(pages, page, prefix) {
	const list = pages[page - 1] && pages[page - 1].length ? pages[page - 1] : pages[0];
	let total = 0;
	for (const x of commands) total++;

	return list.join("\n\n") +
		"\n\n⭔ " + toBold("Page") + " " + toBold(page + "/3") +
		"\n⭔ " + toBold("Total Commands") + ": " + toBold(total) +
		"\n⭔ " + toBold("Type") + " " + prefix + toSmall("help") + " <cmd> " + toBold("to see details") +
		"\n\n" + toBold("react to next page 📄 ");
		}
