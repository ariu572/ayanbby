const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { pipeline } = require("stream/promises");

const API_BASE = "https://exxdev.onrender.com/api";

async function downloadVideo(url) {
  // 1. Get download info
  const res = await axios.get(`${API_BASE}/alldownload`, {
    params: { url },
    timeout: 20000
  });

  if (!res.data?.success) throw new Error(res.data?.error || "Failed to get video info");

  const data = res.data;
  const title = data.title || "Video";

  // Priority: highest quality available
  const videoUrl = data.hd || data.video_url || data.sd || data.url;
  if (!videoUrl) throw new Error("No video URL found");

  const filePath = path.join(__dirname, "cache", `autolink_\( {Date.now()}_ \){Math.random().toString(36).slice(2, 7)}.mp4`);
  await fs.ensureDir(path.join(__dirname, "cache"));

  // 2. Stream download (much faster + low memory)
  const response = await axios({
    method: "GET",
    url: videoUrl,
    responseType: "stream",
    timeout: 90000,
    maxRedirects: 5,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "identity",
      "Referer": "https://www.facebook.com/",
      "Origin": "https://www.facebook.com"
    }
  });

  const writer = fs.createWriteStream(filePath);
  await pipeline(response.data, writer);

  return { title, filePath };
}

module.exports = {
  config: {
    name: "autolink",
    version: "1.6",
    author: "Akash edit by MAMUN",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Auto download videos from links (Fast)"
    },
    longDescription: {
      en: "Automatically detects and downloads videos from links very fast"
    },
    category: "media",
    guide: {
      en: "Just send any video link"
    }
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const linkMatches = body.match(/(https?:\/\/[^\s]+)/g);
    if (!linkMatches) return;

    const uniqueLinks = [...new Set(linkMatches)];

    // Only video platforms
    const videoLinks = uniqueLinks.filter(url =>
      /facebook\.com|fb\.watch|fb\.com|tiktok\.com|vm\.tiktok|instagram\.com|youtu\.be|youtube\.com|twitter\.com|x\.com/i.test(url)
    );

    if (videoLinks.length === 0) return;

    api.setMessageReaction("⏳", messageID, () => {}, true);

    let success = 0;
    let fail = 0;

    // Parallel download (max 2 at a time to avoid overload)
    const chunks = [];
    for (let i = 0; i < videoLinks.length; i += 2) {
      chunks.push(videoLinks.slice(i, i + 2));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (url) => {
          try {
            const { title, filePath } = await downloadVideo(url);

            if (!fs.existsSync(filePath)) throw new Error("File missing");

            const sizeMB = fs.statSync(filePath).size / (1024 * 1024);
            if (sizeMB > 25) {
              fs.unlinkSync(filePath);
              fail++;
              return;
            }

            await api.sendMessage(
              {
                body: `𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐕𝐢𝐝𝐞𝐨 𝐁𝐚𝐛𝐲 <😘\n\n• 𝐀𝐝𝐦𝐢𝐧: 𝗠𝗔𝗠𝗨𝗡\n==========================\n\n🎬 ${title}\n📦 ${sizeMB.toFixed(2)} MB`,
                attachment: fs.createReadStream(filePath)
              },
              threadID,
              () => fs.unlink(filePath).catch(() => {})
            );

            success++;
          } catch (err) {
            console.error("Autolink Error:", err.message);
            fail++;
          }
        })
      );
    }

    const reaction = success > 0 && fail === 0 ? "✅" : success > 0 ? "⚠️" : "❌";
    api.setMessageReaction(reaction, messageID, () => {}, true);
  }
};
