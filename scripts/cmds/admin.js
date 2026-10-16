const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "admin",
		aliases: ["abal", "operator", "op"],
		version: "3.3",
		author: "〲MAMUNツ࿐ T.T o.O",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Operator system"
		},
		longDescription: {
			en: "Add/remove operator and view operator list"
		},
		category: "box chat",
		guide: {
			en:
				"{pn} add <uid/@tag/reply>\n" +
				"{pn} remove <uid/@tag/reply>\n" +
				"{pn} list\n" +
				"{pn} check <uid>"
		}
	},

	langs: {
		en: {
			missingIdAdd:
				"⚠️ ᴘʟᴇᴀꜱᴇ ᴇɴᴛᴇʀ ᴜɪᴅ, ᴛᴀɢ ᴏʀ ʀᴇᴘʟʏ.",

			missingIdRemove:
				"⚠️ ᴘʟᴇᴀꜱᴇ ᴇɴᴛᴇʀ ᴜɪᴅ, ᴛᴀɢ ᴏʀ ʀᴇᴘʟʏ.",

			added:
				"✦ ᴀᴅᴅᴇᴅ ᴏᴘᴇʀᴀᴛᴏʀꜱ ✦\n" +
				"┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
				"%2\n" +
				"┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
				"ᴛᴏᴛᴀʟ : %1",

			alreadyAdmin:
				"\n\n✦ ᴀʟʀᴇᴀᴅʏ ᴏᴘᴇʀᴀᴛᴏʀ ✦\n" +
				"┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
				"%2",

			removed:
				"✦ ʀᴇᴍᴏᴠᴇᴅ ᴏᴘᴇʀᴀᴛᴏʀꜱ ✦\n" +
				"┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
				"%2\n" +
				"┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
				"ᴛᴏᴛᴀʟ : %1",

			notAdmin:
				"\n\n✦ ɴᴏᴛ ᴀɴ ᴏᴘᴇʀᴀᴛᴏʀ ✦\n" +
				"┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
				"%2"
		}
	},

	onStart: async function ({
		message,
		args,
		usersData,
		event,
		getLang
	}) {

		const senderID = event.senderID;

		// 👑 MAIN ADMIN
		const OWNER = [
			"61595489399118",
			"61595057655929"
		];

		const isOwner = OWNER.includes(senderID);

		// Make sure adminBot exists
		if (!Array.isArray(config.adminBot)) {
			config.adminBot = [];
		}

		// Remove duplicate operators
		config.adminBot = [...new Set(config.adminBot)];

		// Get target UID
		const getTargetUIDs = () => {

			let uids = [];

			// Reply
			if (event.type === "message_reply") {
				uids.push(event.messageReply.senderID);
			}

			// Mention
			else if (
				event.mentions &&
				Object.keys(event.mentions).length > 0
			) {
				uids = Object.keys(event.mentions);
			}

			// UID
			else {
				uids = args
					.slice(1)
					.filter(uid => /^\d+$/.test(uid));
			}

			return [...new Set(uids)];
		};

		// ═══════════════════════════════
		// 👑 ADD OPERATOR
		// ═══════════════════════════════

		if (
			args[0] === "add" ||
			args[0] === "-a"
		) {

			if (!isOwner) {
				return message.reply(
					"❌ ᴏɴʟʏ ᴍᴀɪɴ ᴀᴅᴍɪɴ ᴄᴀɴ ᴀᴅᴅ ᴏᴘᴇʀᴀᴛᴏʀ."
				);
			}

			const uids = getTargetUIDs();

			if (uids.length === 0) {
				return message.reply(
					getLang("missingIdAdd")
				);
			}

			const added = [];
			const already = [];

			for (const uid of uids) {

				// Owner cannot be added as operator
				if (OWNER.includes(uid)) {
					already.push(uid);
					continue;
				}

				if (config.adminBot.includes(uid)) {
					already.push(uid);
				} else {
					config.adminBot.push(uid);
					added.push(uid);
				}
			}

			const addedNames = await Promise.all(
				added.map(async uid => {

					let name;

					try {
						name = await usersData.getName(uid);
					} catch {
						name = "Unknown";
					}

					return `• ɴᴀᴍᴇ : ${name}\n  ᴜɪᴅ  : ${uid}`;
				})
			);

			const alreadyNames = await Promise.all(
				already.map(async uid => {

					let name;

					try {
						name = await usersData.getName(uid);
					} catch {
						name = "Unknown";
					}

					return `• ɴᴀᴍᴇ : ${name}\n  ᴜɪᴅ  : ${uid}`;
				})
			);

			writeFileSync(
				global.client.dirConfig,
				JSON.stringify(config, null, 2)
			);

			return message.reply(
				(added.length > 0
					? getLang(
						"added",
						added.length,
						addedNames.join("\n")
					)
					: "")
				+
				(already.length > 0
					? getLang(
						"alreadyAdmin",
						already.length,
						alreadyNames.join("\n")
					)
					: "")
			);
		}

		// ═══════════════════════════════
		// 🗑 REMOVE OPERATOR
		// ═══════════════════════════════

		if (
			args[0] === "remove" ||
			args[0] === "-r"
		) {

			if (!isOwner) {
				return message.reply(
					"❌ ᴏɴʟʏ ᴍᴀɪɴ ᴀᴅᴍɪɴ ᴄᴀɴ ʀᴇᴍᴏᴠᴇ ᴏᴘᴇʀᴀᴛᴏʀ."
				);
			}

			const uids = getTargetUIDs();

			if (uids.length === 0) {
				return message.reply(
					getLang("missingIdRemove")
				);
			}

			const removed = [];
			const notAdmin = [];

			for (const uid of uids) {

				// Owner protection
				if (OWNER.includes(uid)) {
					notAdmin.push(uid);
					continue;
				}

				const index = config.adminBot.indexOf(uid);

				if (index !== -1) {
					config.adminBot.splice(index, 1);
					removed.push(uid);
				} else {
					notAdmin.push(uid);
				}
			}

			const removedNames = await Promise.all(
				removed.map(async uid => {

					let name;

					try {
						name = await usersData.getName(uid);
					} catch {
						name = "Unknown";
					}

					return `• ɴᴀᴍᴇ : ${name}\n  ᴜɪᴅ  : ${uid}`;
				})
			);

			const notAdminNames = await Promise.all(
				notAdmin.map(async uid => {

					let name;

					try {
						name = await usersData.getName(uid);
					} catch {
						name = "Unknown";
					}

					return `• ɴᴀᴍᴇ : ${name}\n  ᴜɪᴅ  : ${uid}`;
				})
			);

			writeFileSync(
				global.client.dirConfig,
				JSON.stringify(config, null, 2)
			);

			return message.reply(
				(removed.length > 0
					? getLang(
						"removed",
						removed.length,
						removedNames.join("\n")
					)
					: "")
				+
				(notAdmin.length > 0
					? getLang(
						"notAdmin",
						notAdmin.length,
						notAdminNames.join("\n")
					)
					: "")
			);
		}

		// ═══════════════════════════════
		// 📋 ADMIN LIST
		// ═══════════════════════════════

		if (
			args[0] === "list" ||
			args[0] === "-l"
		) {

			const getNames = await Promise.all(
				config.adminBot.map(async uid => {

					let name;

					try {
						name = await usersData.getName(uid);
					} catch {
						name = "Unknown";
					}

					return {
						name,
						uid
					};
				})
			);

			const numberEmojis = ["➊", "➋", "➌", "➍", "➎", "➏", "➐", "➑", "➒", "➓"];

			const operatorList =
				getNames.length > 0
					? getNames
						.map(
							(i, index) =>
								`${numberEmojis[index] || (index + 1)}  ${i.name}\n` +
								`    ╰┈➤ ${i.uid}`
						)
						.join("\n\n")
					: "   ❌ ɴᴏ ᴏᴘᴇʀᴀᴛᴏʀꜱ ꜰᴏᴜɴᴅ";

			const list =
`✦ ᴀᴅᴍɪɴ ʟɪꜱᴛ ✦
┈┈┈┈┈┈┈┈┈┈┈┈┈┈
${operatorList}`;

			return message.reply(list);
		}

		// ═══════════════════════════════
		// 🔎 CHECK
		// ═══════════════════════════════

		if (args[0] === "check") {

			const uid = args[1];

			if (!uid || !/^\d+$/.test(uid)) {
				return message.reply(
					"⚠️ ᴜꜱᴀɢᴇ : ᴀᴅᴍɪɴ ᴄʜᴇᴄᴋ <ᴜɪᴅ>"
				);
			}

			let name;

			try {
				name = await usersData.getName(uid);
			} catch {
				name = "Unknown";
			}

			if (OWNER.includes(uid)) {

				return message.reply(
					`👑 ɴᴀᴍᴇ : ${name}\n` +
					`ᴜɪᴅ  : ${uid}\n` +
					`ʀᴏʟᴇ : ᴍᴀɪɴ ᴏᴡɴᴇʀ`
				);
			}

			if (config.adminBot.includes(uid)) {

				return message.reply(
					`⚡ ɴᴀᴍᴇ : ${name}\n` +
					`ᴜɪᴅ  : ${uid}\n` +
					`ʀᴏʟᴇ : ᴏᴘᴇʀᴀᴛᴏʀ`
				);
			}

			return message.reply(
				`❌ ɴᴀᴍᴇ : ${name}\n` +
				`ᴜɪᴅ  : ${uid}\n` +
				`ʀᴏʟᴇ : ᴜꜱᴇʀ`
			);
		}

		return message.SyntaxError();
	}
};
