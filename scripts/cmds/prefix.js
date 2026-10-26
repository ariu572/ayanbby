const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");
const { downloadVideo } = require("sagor-video-downloader");

const VIDEO_URL = "https://vm.tiktok.com/ZSg61n5hw/";
const CACHE_DIR = path.join(__dirname, "cache", "prefix");
const VIDEO_FILE = path.join(CACHE_DIR, "prefix_video.mp4");

module.exports = {
  config: {
    name: "prefix",
    version: "2.5",
    author: "ariYa'n bb'z",
    countDown: 5,
    role: 0,
    description: "Change prefix and show prefix with TikTok video",
    category: "config"
  },

  langs: {
    en: {
      usage: "❌ Usage: prefix <newPrefix> | prefix reset | prefix <newPrefix> -g",
      reset: "✅ Prefix reset successful!\n🔰 System prefix: %1",
      onlyAdmin: "⛔ Only bot admin can change global prefix.",
      confirmGlobal: "⚙️ Global prefix change requested.\n👉 React to confirm.",
      confirmThisThread: "🛠️ Group prefix change requested.\n👉 React to confirm.",
      successGlobal: "✅ Global prefix changed!\n🆕 New prefix: %1",
      successThisThread: "✅ Group prefix changed!\n🆕 New prefix: %1"
    }
  },

  onStart: async function ({
    message,
    role,
    args,
    commandName,
    event,
    threadsData,
    getLang
  }) {
    if (!args[0]) {
      return message.reply(getLang("usage"));
    }

    if (args[0].toLowerCase() === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");

      return message.reply(
        getLang("reset", global.GoatBot.config.prefix)
      );
    }

    const newPrefix = args[0];
    const setGlobal = args[1] === "-g";

    if (setGlobal && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }

    const confirmMsg = setGlobal
      ? getLang("confirmGlobal")
      : getLang("confirmThisThread");

    message.reply(confirmMsg, (err, info) => {
      if (err || !info) return;

      global.GoatBot.onReaction.set(info.messageID, {
        commandName,
        author: event.senderID,
        newPrefix,
        setGlobal
      });
    });
  },

  onReaction: async function ({
    event,
    message,
    threadsData,
    Reaction,
    getLang
  }) {
    if (event.userID !== Reaction.author) return;

    global.GoatBot.onReaction.delete(event.messageID);

    if (Reaction.setGlobal) {
      global.GoatBot.config.prefix = Reaction.newPrefix;

      fs.writeFileSync(
        global.client.dirConfig,
        JSON.stringify(global.GoatBot.config, null, 2)
      );

      return message.reply(
        getLang("successGlobal", Reaction.newPrefix)
      );
    }

    await threadsData.set(
      event.threadID,
      Reaction.newPrefix,
      "data.prefix"
    );

    return message.reply(
      getLang("successThisThread", Reaction.newPrefix)
    );
  },

  onChat: async function ({ event, message, threadsData }) {
    if (
      !event.body ||
      event.body.trim().toLowerCase() !== "prefix"
    ) {
      return;
    }

    const systemPrefix = global.GoatBot.config.prefix;
    const groupPrefix = global.utils.getPrefix(event.threadID);

    const threadInfo = await threadsData.get(event.threadID);
    const groupName = threadInfo?.threadName || "Unknown Group";

    const now = moment().tz("Asia/Dhaka");
    const time = now.format("hh:mm A");
    const date = now.format("DD MMM YYYY");

    const owner =
      global.GoatBot.config.adminName || "Aruu bb'z";

    const body =
`╭━━━〔 PREFIX 〕━━━╮
┃ 🎀 GROUP : ${groupName}
┃ ☠️ SYSTEM : 『 ${systemPrefix} 』
┃ ☯️ GROUP  : 『 ${groupPrefix} 』
┃ 💠 TIME   : ${time}
┃ ⚠️ DATE   : ${date}
┃ Ⓜ️ OWNER  : ${owner}
╰━━━〔 ✨ Only Aruu bb'z 👅🫀 〕━━━╯`;

    try {
      await fs.ensureDir(CACHE_DIR);

      // Reuse the cached video if it already exists.
      if (
        !(await fs.pathExists(VIDEO_FILE)) ||
        (await fs.stat(VIDEO_FILE)).size === 0
      ) {
        console.log("[Prefix] Downloading TikTok video...");

        const result = await downloadVideo(VIDEO_URL);

        let videoPath = null;
        let directUrl = null;

        if (Buffer.isBuffer(result)) {
          await fs.writeFile(VIDEO_FILE, result);
          videoPath = VIDEO_FILE;
        } else if (typeof result === "string") {
          if (/^https?:\/\//i.test(result)) {
            directUrl = result;
          } else if (await fs.pathExists(result)) {
            videoPath = result;
          }
        } else if (result && typeof result === "object") {
          const value =
            result.filePath ||
            result.filepath ||
            result.path ||
            result.videoUrl ||
            result.downloadUrl ||
            result.url ||
            result.data?.videoUrl ||
            result.data?.url;

          if (Buffer.isBuffer(value)) {
            await fs.writeFile(VIDEO_FILE, value);
            videoPath = VIDEO_FILE;
          } else if (typeof value === "string") {
            if (/^https?:\/\//i.test(value)) {
              directUrl = value;
            } else if (await fs.pathExists(value)) {
              videoPath = value;
            }
          }
        }

        if (directUrl) {
          const response = await axios.get(directUrl, {
            responseType: "arraybuffer",
            timeout: 90000,
            maxRedirects: 10
          });

          const contentType =
            response.headers["content-type"] || "";

          if (
            contentType.includes("text/html") ||
            contentType.includes("application/json")
          ) {
            throw new Error("The URL did not return a video");
          }

          await fs.writeFile(VIDEO_FILE, response.data);
          videoPath = VIDEO_FILE;
        }

        if (!videoPath || !(await fs.pathExists(videoPath))) {
          throw new Error(
            "TikTok downloader did not return a usable video file"
          );
        }

        if (videoPath !== VIDEO_FILE) {
          await fs.copyFile(videoPath, VIDEO_FILE);
        }

        if ((await fs.stat(VIDEO_FILE)).size === 0) {
          throw new Error("Downloaded video is empty");
        }

        console.log("[Prefix] Video downloaded successfully.");
      }

      // Send prefix information and video in one message.
      return message.reply({
        body,
        attachment: fs.createReadStream(VIDEO_FILE)
      });
    } catch (error) {
      console.log("[Prefix] Video error:", error.message);

      // Still show prefix information if TikTok download fails.
      return message.reply(
        body +
        "\n\n⚠️ ভিডিও পাঠানো যায়নি।\n" +
        "🎥 TikTok: " + VIDEO_URL
      );
    }
  }
};
