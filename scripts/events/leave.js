const { getTime } = global.utils;
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

module.exports = {
	config: {
		name: "leave",
		version: "2.9",
		author: "mamun",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			leaveType1: "tự rời",
			leaveType2: "bị kick",
			defaultLeaveMessage: "{userName} đã {type} khỏi nhóm"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			leaveType1: "left",
			leaveType2: "was kicked from",
			defaultLeaveMessage: "💔 {userName} {type} the group.\n\n🌸 We'll miss you! Take care and stay safe ✨"
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType !== "log:unsubscribe") return;

		return async function () {
			const { threadID } = event;
			const threadData = await threadsData.get(threadID);
			if (!threadData.settings.sendLeaveMessage) return;

			const { leftParticipantFbId } = event.logMessageData;
			if (leftParticipantFbId == api.getCurrentUserID()) return;

			const hours = getTime("HH");
			const threadName = threadData.threadName;

			// ========== Name Getting ==========
			let userName = null;
			try {
				userName = await usersData.getName(leftParticipantFbId);
			} catch (e) {}

			if (!userName || userName === "null" || userName === "undefined" || userName.trim() === "") {
				try {
					const info = await api.getUserInfo(leftParticipantFbId);
					userName = info[leftParticipantFbId]?.name;
				} catch (e) {}
			}
			if (!userName || userName === "null" || userName === "undefined") {
				userName = "Someone";
			}

			const isKicked = leftParticipantFbId != event.author;

			let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
			const session = hours <= 10 ? getLang("session1") :
				hours <= 12 ? getLang("session2") :
					hours <= 18 ? getLang("session3") : getLang("session4");

			leaveMessage = leaveMessage
				.replace(/\{userName\}/g, userName)
				.replace(/\{type\}/g, isKicked ? getLang("leaveType2") : getLang("leaveType1"))
				.replace(/\{time\}/g, hours)
				.replace(/\{session\}/g, session)
				.replace(/\{threadName\}/g, threadName);

			try {
				const cacheDir = path.join(__dirname, "cache");
				await fs.ensureDir(cacheDir);

				const fontPaths = [
					{ path: "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf", family: "Noto" },
					{ path: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", family: "DejaVu" },
					{ path: "C:\\Windows\\Fonts\\segoeui.ttf", family: "Segoe" },
					{ path: "C:\\Windows\\Fonts\\arial.ttf", family: "Arial" }
				];
				for (const f of fontPaths) {
					try {
						if (fs.existsSync(f.path)) {
							registerFont(f.path, { family: f.family });
							break;
						}
					} catch {}
				}

				const threadInfo = await api.getThreadInfo(threadID);
				const memberCount = threadInfo.participantIDs.length;

				// ===== Canvas =====
				const canvas = createCanvas(1100, 520);
				const ctx = canvas.getContext("2d");

				const bg = ctx.createRadialGradient(550, 260, 50, 550, 260, 700);
				bg.addColorStop(0, "#0a1628");
				bg.addColorStop(0.5, "#07101c");
				bg.addColorStop(1, "#040a12");
				ctx.fillStyle = bg;
				ctx.fillRect(0, 0, 1100, 520);

				ctx.globalAlpha = 0.05;
				ctx.font = "bold 180px Noto, DejaVu, Segoe, Arial, sans-serif";
				ctx.fillStyle = "#3b82f6";
				ctx.textAlign = "center";
				ctx.fillText("LEAVE", 550, 310);
				ctx.globalAlpha = 1;

				// Left card
				ctx.fillStyle = "rgba(10, 20, 40, 0.9)";
				roundRect(ctx, 40, 40, 340, 440, 28);
				ctx.fill();

				ctx.strokeStyle = "#3b82f6";
				ctx.lineWidth = 3;
				ctx.shadowColor = "#3b82f6";
				ctx.shadowBlur = 18;
				roundRect(ctx, 40, 40, 340, 440, 28);
				ctx.stroke();
				ctx.shadowBlur = 0;

				// ========== Avatar (Fixed) ==========
				const avatarSize = 210;
				const avatarX = 210;
				const avatarY = 200;

				try {
					// Multiple fallback methods for profile picture
					let avatarUrl = `https://graph.facebook.com/${leftParticipantFbId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d2527f5e94678934e26`;
					
					const res = await axios.get(avatarUrl, { 
						responseType: "arraybuffer", 
						timeout: 10000,
						headers: { "User-Agent": "Mozilla/5.0" }
					});
					
					const avatar = await loadImage(Buffer.from(res.data));

					ctx.save();
					ctx.beginPath();
					ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
					ctx.restore();
				} catch (err) {
					console.log("Avatar load failed:", err.message);
					// Fallback circle
					ctx.fillStyle = "#0f1c2e";
					ctx.beginPath();
					ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
					ctx.fill();
				}

				// Blue ring
				ctx.strokeStyle = "#3b82f6";
				ctx.lineWidth = 6;
				ctx.shadowColor = "#3b82f6";
				ctx.shadowBlur = 14;
				ctx.beginPath();
				ctx.arc(avatarX, avatarY, avatarSize / 2 + 4, 0, Math.PI * 2);
				ctx.stroke();
				ctx.shadowBlur = 0;

				// Developer: MAMUN  (clean under avatar)
				ctx.font = "bold 20px Noto, DejaVu, Segoe, Arial, sans-serif";
				ctx.fillStyle = "#93c5fd";
				ctx.textAlign = "center";
				ctx.fillText("💻 Developer: MAMUN", 210, 380);

				// Right side
				ctx.textAlign = "left";
				ctx.font = "bold 58px Noto, DejaVu, Segoe, Arial, sans-serif";
				ctx.fillStyle = "#ffffff";
				ctx.shadowColor = "rgba(59, 130, 246, 0.45)";
				ctx.shadowBlur = 12;
				ctx.fillText("GOODBYE", 430, 110);
				ctx.shadowBlur = 0;

				ctx.font = "bold 36px Noto, DejaVu, Segoe, Arial, sans-serif";
				ctx.fillStyle = "#f1f5f9";
				let displayName = userName;
				if (ctx.measureText(displayName).width > 520) {
					while (ctx.measureText(displayName + "...").width > 520) {
						displayName = displayName.slice(0, -1);
					}
					displayName += "...";
				}
				ctx.fillText(displayName, 430, 165);

				ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
				roundRect(ctx, 430, 195, 520, 55, 14);
				ctx.fill();
				ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
				ctx.lineWidth = 1.5;
				roundRect(ctx, 430, 195, 520, 55, 14);
				ctx.stroke();

				ctx.font = "22px Noto, DejaVu, Segoe, Arial, sans-serif";
				ctx.fillStyle = "#e2e8f0";
				ctx.fillText(isKicked ? "💔  Was kicked from the group." : "💔  Has left the group.", 455, 230);

				ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
				roundRect(ctx, 430, 270, 520, 50, 12);
				ctx.fill();

				ctx.font = "15px monospace";
				ctx.fillStyle = "#93c5fd";
				ctx.globalAlpha = 0.9;
				ctx.fillText("01F 01F 01F 01F 01F 01F 01F 01F 01F 01F 01F ...", 450, 302);
				ctx.globalAlpha = 1;

				ctx.fillStyle = "#3b82f6";
				roundRect(ctx, 430, 350, 180, 55, 14);
				ctx.fill();

				ctx.font = "bold 22px Noto, DejaVu, Segoe, Arial, sans-serif";
				ctx.fillStyle = "#ffffff";
				ctx.textAlign = "center";
				ctx.fillText(`👤  ${memberCount} LEFT`, 520, 385);

				ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
				roundRect(ctx, 630, 350, 320, 55, 14);
				ctx.fill();
				ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
				ctx.lineWidth = 1.5;
				roundRect(ctx, 630, 350, 320, 55, 14);
				ctx.stroke();

				const now = new Date();
				const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
				const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

				ctx.font = "18px Noto, DejaVu, Segoe, Arial, sans-serif";
				ctx.fillStyle = "#e2e8f0";
				ctx.fillText(`🕒  ${timeStr}  ·  ${dateStr}`, 790, 385);

				const cachePath = path.join(cacheDir, `leave_\( {leftParticipantFbId}_ \){Date.now()}.png`);
				const buffer = canvas.toBuffer("image/png");
				await fs.writeFile(cachePath, buffer);

				message.reply({
					body: leaveMessage,
					attachment: fs.createReadStream(cachePath)
				}, () => {
					try { fs.unlinkSync(cachePath); } catch {}
				});

			} catch (err) {
				console.error("Leave card error:", err);
				message.reply(leaveMessage);
			}
		};
	}
};

function roundRect(ctx, x, y, w, h, r) {
	if (w < 2 * r) r = w / 2;
	if (h < 2 * r) r = h / 2;
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
					}
