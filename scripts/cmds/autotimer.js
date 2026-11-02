Cmd install autotimer.js const moment = require("moment-timezone");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { downloadVideo } = require("sagor-video-downloader");
const TZ = "Asia/Dhaka";
const CACHE_DIR = path.join(__dirname, "cache", "autotimer");
const STATE_FILE = path.join(CACHE_DIR, "state.json");
const CHECK_INTERVAL = 15000;
let interval = null;
let running = false;
let prayerTimes = {};
let prayerDate = "";
let hourlyIndex = 0;
const sent = new Set();
const PRAYER_VIDEOS = {
  Fajr: "https://files.catbox.moe/ee9khu.mp4",
  Dhuhr: "https://files.catbox.moe/c5qbek.mp4",
  Asr: "https://files.catbox.moe/vcgbxq.mp4",
  Maghrib: "https://files.catbox.moe/y8pnz7.mp4",
  Isha: "https://files.catbox.moe/rpnut9.mp4"
};
const VIDEO_LINKS = [
  "https://vm.tiktok.com/ZSgjEsuVY/",
  "https://vm.tiktok.com/ZSgjoJSTf/",
  "https://vm.tiktok.com/ZSgjETWbr/",
  "https://vm.tiktok.com/ZSgjETe5S/",
  "https://vm.tiktok.com/ZSgjorety/",
  "https://vm.tiktok.com/ZSgjo2GHV/",
  "https://vm.tiktok.com/ZSgjoNAYo/",
  "https://vm.tiktok.com/ZSgjobepV/",
  "https://vm.tiktok.com/ZSgjoUQ7m/",
  "https://vm.tiktok.com/ZSgjoDSma/",
  "https://vm.tiktok.com/ZSg61d42X/",
  "https://vm.tiktok.com/ZSg6156Cr/",
  "https://vm.tiktok.com/ZSg61DbyV/",
  "https://vm.tiktok.com/ZSg61rF7Q/",
  "https://vm.tiktok.com/ZSgor4Q18/",
  "https://vm.tiktok.com/ZSgohdrpj/",
  "https://vm.tiktok.com/ZSgohd3VF/",
  "https://vm.tiktok.com/ZSg61n5hw/"
];
const PRAYER_NAMES = { Fajr: "ফজরের", Dhuhr: "যোহরের", Asr: "আসরের", Maghrib: "মাগরিবের", Isha: "এশার" };
const HOURLY_MESSAGES = [
  "🌿 আল্লাহর প্রতিটি নিয়ামতের জন্য আলহামদুলিল্লাহ বলুন।",
  "🤲 নিজের ও পরিবারের জন্য দোয়া করুন।",
  "✨ ব্যস্ততার মাঝেও আল্লাহকে স্মরণ করুন।",
  "🌙 আল্লাহ আমাদের সবাইকে হেফাজত করুন।",
  "💚 ভালো কথা বলুন, ভালো কাজ করুন।",
  "📿 সুবহানাল্লাহ, আলহামদুলিল্লাহ, আল্লাহু আকবার।",
  "🤍 আল্লাহর রহমতের আশা রাখুন।",
  "🌸 মানুষের সঙ্গে সুন্দর ব্যবহার করুন।",
  "🤲 আপনার প্রতিটি ভালো কাজ কবুল হোক।",
  "🌱 নতুন মুহূর্ত, ভালো কাজের নতুন সুযোগ।",
  "💫 আল্লাহর ওপর ভরসা রাখুন।",
  "🕊️ মনকে শান্ত রাখুন এবং দোয়া করুন।"
];
async function loadState() { await fs.ensureDir(CACHE_DIR); try { const state = await fs.readJson(STATE_FILE); hourlyIndex = Number.isInteger(state.hourlyIndex) && state.hourlyIndex >= 0 ? state.hourlyIndex % VIDEO_LINKS.length : 0; } catch { hourlyIndex = 0; await saveState(); } }
async function saveState() { await fs.ensureDir(CACHE_DIR); await fs.writeJson(STATE_FILE, { hourlyIndex }, { spaces: 2 }); }
async function getPrayerTimes() { const date = moment().tz(TZ).format("DD-MM-YYYY"); const response = await axios.get(`https://api.aladhan.com/v1/timings/${date}`, { params: { latitude: 23.8103, longitude: 90.4125, method: 1, school: 1 }, timeout: 15000 }); if (response.data.code !== 200) throw new Error("Prayer API returned an error"); const t = response.data.data.timings; return { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha }; }
async function refreshPrayerTimes() { try { prayerTimes = await getPrayerTimes(); prayerDate = moment().tz(TZ).format("YYYY-MM-DD"); } catch (error) { console.log("[AutoTimer] Prayer API error:", error.message); } }
function validFile(file) { try { return typeof file === "string" && fs.existsSync(file) && fs.statSync(file).isFile() && fs.statSync(file).size > 0; } catch { return false; } }
async function downloadDirect(url, destination) { const response = await axios.get(url, { responseType: "stream", timeout: 90000, maxRedirects: 10 }); const contentType = response.headers["content-type"] || ""; if (contentType.includes("text/html") || contentType.includes("application/json")) { response.data.destroy(); throw new Error("URL did not return a video"); } await new Promise((resolve, reject) => { const writer = fs.createWriteStream(destination); response.data.pipe(writer); writer.on("finish", resolve); writer.on("error", reject); response.data.on("error", reject); }); if (!validFile(destination)) throw new Error("Downloaded file is empty"); return destination; }
function extractResult(result) { if (typeof result === "string" || Buffer.isBuffer(result)) return result; if (result && typeof result === "object") { return result.filePath || result.filepath || result.path || result.videoUrl || result.downloadUrl || result.url || result.video || result.data?.videoUrl || result.data?.url || null; } return null; }
async function getPrayerVideo(prayerKey) { const destination = path.join(CACHE_DIR, `prayer_${prayerKey}.mp4`); if (validFile(destination)) return destination; return downloadDirect(PRAYER_VIDEOS[prayerKey], destination); }

// FIXED - ekhon sob link serial e asbe
async function getHourlyVideo(index) {
  const destination = path.join(CACHE_DIR, `hourly_${index + 1}.mp4`);
  if (await fs.pathExists(destination)) await fs.remove(destination);
  console.log(`[AutoTimer] Downloading hourly ${index + 1}/${VIDEO_LINKS.length}`);
  const result = await downloadVideo(VIDEO_LINKS[index]);
  const extracted = extractResult(result);
  if (Buffer.isBuffer(extracted)) { await fs.writeFile(destination, extracted); return destination; }
  if (typeof extracted === "string" && validFile(extracted)) { if (path.resolve(extracted) !== path.resolve(destination)) await fs.copyFile(extracted, destination); return destination; }
  if (typeof extracted === "string" && /^https?:\/\//i.test(extracted)) return downloadDirect(extracted, destination);
  throw new Error("TikTok downloader returned no usable video");
}
async function sendToGroups(api, body, filepath) { const threads = await api.getThreadList(200, null, ["INBOX"]); const groups = threads.filter(thread => thread.isGroup); if (!groups.length) throw new Error("No Messenger groups found in inbox"); let success = 0; for (const thread of groups) { try { await api.sendMessage({ body, attachment: fs.createReadStream(filepath) }, thread.threadID); success++; } catch (error) { console.log(`[AutoTimer] Group ${thread.threadID} failed:`, error.message); } await new Promise(resolve => setTimeout(resolve, 1200)); } if (!success) throw new Error("Message failed in all groups"); }
function findPrayer(now) { for (const [name, value] of Object.entries(prayerTimes)) { if (String(value).slice(0, 5) === now.format("HH:mm")) return name; } return null; }
module.exports = {
  config: { name: "autotimer", aliases: ["atimer"], version: "7.0.3", author: "ariYa'n bb'z bot", countDown: 5, role: 2, description: "Hourly TikTok and five prayer video reminders", category: "system", guide: "{pn} status / next / list / reload" },
  onStart: async function ({ message, args }) {
    const command = (args[0] || "status").toLowerCase();
    if (command === "status") { return message.reply("✅ AutoTimer: Enabled\n🕌 Five prayer reminders: Enabled\n🎥 Prayer: Old videos\n" + `⏰ Hourly: ${VIDEO_LINKS.length} TikTok videos\n📹 Next hourly video: ${hourlyIndex + 1}\n🌏 Timezone: Asia/Dhaka\n🤖 ariYa'n bb'z bot 🚩`); }
    if (command === "next") { try { const prayers = await getPrayerTimes(); const now = moment().tz(TZ); const upcoming = []; for (const [name, value] of Object.entries(prayers)) { const match = String(value).match(/^(\d{1,2}):(\d{2})/); if (!match) continue; const target = now.clone().set({ hour: Number(match[1]), minute: Number(match[2]), second: 0, millisecond: 0 }); if (target.isAfter(now)) upcoming.push({ name, target }); } upcoming.sort((a, b) => a.target.valueOf() - b.target.valueOf()); if (!upcoming.length) return message.reply("🕌 আজকের নামাজের সময় শেষ হয়েছে।"); const next = upcoming[0]; return message.reply(`🕌 পরবর্তী নামাজ: ${PRAYER_NAMES[next.name]} নামাজ\n🕒 সময়: ${next.target.format("hh:mm A")}\n📅 তারিখ: ${next.target.format("DD-MM-YYYY")}`); } catch (error) { return message.reply("⚠️ নামাজের সময় পাওয়া যায়নি। পরে চেষ্টা করুন।"); } }
    if (command === "list") { return message.reply("🕌 Fajr, Dhuhr, Asr, Maghrib, Isha\n🎥 নামাজের সময়: পুরোনো ভিডিও\n⏰ প্রতি ঘণ্টায়: নতুন TikTok ভিডিও\n" + `📹 নতুন ভিডিও: ${VIDEO_LINKS.length}টি\n🌏 Asia/Dhaka`); }
    if (command === "reload") { try { await fs.ensureDir(CACHE_DIR); for (const file of await fs.readdir(CACHE_DIR)) { if (file.endsWith(".mp4")) await fs.remove(path.join(CACHE_DIR, file)); } return message.reply("♻️ Video cache পরিষ্কার হয়েছে।"); } catch (error) { return message.reply(`❌ Cache error: ${error.message}`); } }
    return message.reply("📌 AutoTimer Commands\n\nautotimer status\nautotimer next\nautotimer list\nautotimer reload");
  },
  onLoad: function ({ api }) {
    if (interval) return; fs.ensureDirSync(CACHE_DIR);
    (async () => {
      await loadState(); await refreshPrayerTimes();
      interval = setInterval(async () => {
        if (running) return; running = true;
        let selectedHourlyIndex = null;
        try {
          const now = moment().tz(TZ); const date = now.format("YYYY-MM-DD"); const minute = now.format("HH:mm");
          if (date !== prayerDate) await refreshPrayerTimes();
          const prayer = findPrayer(now); const key = `${date}_${minute}`;
          if (sent.has(key)) return;
          let body; let filepath;
          if (prayer) {
            body = "━━━━━━━━━━━━━━━━━━\n" + `🕌 ${PRAYER_NAMES[prayer]} নামাজের সময়\n🕒 সময়: ${now.format("hh:mm A")}\n📅 তারিখ: ${now.format("DD-MM-YYYY")}\n━━━━━━━━━━━━━━━━━━\n\n🤲 নামাজের জন্য প্রস্তুতি নিন।\nআল্লাহ আমাদের সবার ইবাদত কবুল করুন।\n\n🤖 ariYa'n bb'z bot 🚩";
            filepath = await getPrayerVideo(prayer);
          } else if (now.minute() === 0) {
            selectedHourlyIndex = hourlyIndex;
            // TUMAR CHAWA FORMAT
            body = "🎀24/7 HOURLY REMINDER🎀\n\n"
                 + `🕒 সময়: ${now.format("hh:mm A")}\n`
                 + `📅 তারিখ: ${now.format("DD-MM-YYYY")}\n`
                 + `Ariyan bb'z nh Aruu's-bot 🤖\n`
                 + `ariYa'n bb'z bot 🚩`;
            filepath = await getHourlyVideo(selectedHourlyIndex);
          } else return;
          await sendToGroups(api, body, filepath); sent.add(key);
          if (selectedHourlyIndex !== null) { hourlyIndex = (selectedHourlyIndex + 1) % VIDEO_LINKS.length; await saveState(); }
          console.log(`[AutoTimer] Completed ${key}`);
        } catch (error) {
          console.log("[AutoTimer] Error:", error.message);
          if (selectedHourlyIndex !== null) { hourlyIndex = (selectedHourlyIndex + 1) % VIDEO_LINKS.length; await saveState(); }
        } finally { running = false; }
      }, CHECK_INTERVAL);
      console.log("[AutoTimer] AUTO-ON successfully.");
    })().catch(error => { console.log("[AutoTimer] Startup error:", error.message); });
  }
};
