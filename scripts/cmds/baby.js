const axios = require("axios");

module.exports.config = {
  name: "baby",
  aliases: ["baby", "bbe", "babe"],
  version: "8.1",
  author: "ariYan bbz",
  countDown: 0,
  role: 0,
  category: "chat"
};

// double reply atkate
const handled = new Set();

function toFancy(text) {
  const map = { a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳", A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉", K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙" };
  return text.split("").map(c => map[c] || c).join("");
}

const lastReply = new Map();

async function getAIReply(text, uid) {
  const low = text.toLowerCase();
  if (low.includes("owner") || low.includes("boss") || low.includes("malik") || low.includes("creator") || low.includes("admin ke") || low.includes("toke ke ban")) {
    return "𝐀𝐫𝐢𝐘𝐚'𝐧 𝐚𝐦𝐚𝐫 𝐁𝐨𝐬𝐬 👑 𝐎𝐧𝐢 𝐚𝐦𝐚𝐤𝐞 𝐛𝐚𝐧𝐚𝐢𝐬𝐞 🖤";
  }
  if (low.includes("ki kro") || low.includes("ki koro") || low.includes("ki korteso") || low.includes("ki korcho")) {
    const arr = ["𝐓𝐨𝐦𝐚𝐫 𝐨𝐩𝐞𝐤𝐤𝐡𝐚𝐲 𝐛𝐨𝐬𝐞 𝐚𝐜𝐡𝐢, 𝐭𝐮𝐦𝐢 𝐤𝐢 𝐤𝐨𝐫𝐨? 😌", "𝐄𝐤𝐭𝐮 𝐭𝐨𝐦𝐚𝐫 𝐤𝐨𝐭𝐡𝐚 𝐯𝐚𝐛𝐭𝐞𝐬𝐢𝐥𝐚𝐦 🥰", "𝐁𝐨𝐫𝐢𝐧𝐠 𝐥𝐚𝐠𝐭𝐞𝐬𝐢𝐥𝐨, 𝐭𝐮𝐦𝐢 𝐚𝐬𝐥𝐚 𝐯𝐚𝐥𝐨 𝐥𝐚𝐠𝐥𝐨 ✨", "𝐂𝐡𝐚𝐭 𝐤𝐨𝐫𝐭𝐞𝐬𝐢 𝐭𝐨𝐦𝐚𝐫 𝐬𝐚𝐭𝐡𝐞, 𝐚𝐫 𝐤𝐢 😎", "𝐒𝐡𝐮𝐲𝐞 𝐬𝐡𝐮𝐲𝐞 𝐭𝐨𝐦𝐚𝐫 𝐦𝐬𝐠 𝐞𝐫 𝐰𝐚𝐢𝐭 𝐤𝐨𝐫𝐭𝐞𝐬𝐢𝐥𝐚𝐦 🖤"];
    let pick = arr[Math.floor(Math.random() * arr.length)];
    while (lastReply.get(uid) === pick) pick = arr[Math.floor(Math.random() * arr.length)];
    lastReply.set(uid, pick);
    return pick;
  }
  try {
    const prompt = `Tumi baby, cute bangla-english mix e kotha bola meye bot. Owner AriYan. Short funny reply dao. User: ${text}`;
    const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, { timeout: 15000 });
    let ai = typeof res.data === "string" ? res.data : "";
    ai = ai.trim().slice(0, 400);
    if (!ai) throw new Error("empty");
    lastReply.set(uid, ai);
    return toFancy(ai);
  } catch (e) {
    return toFancy("Humm bolo, sunci... ar ektu bujhay bolo to?");
  }
}

module.exports.onStart = async ({ api, event, args }) => {
  const text = args.join(" ");
  if (!text) return api.sendMessage(toFancy("Humm bolo sona, sunci..."), event.threadID, event.messageID);
  const reply = await getAIReply(text, event.senderID);
  return api.sendMessage(reply, event.threadID, event.messageID);
};

// *** onReply EKHANE NAI - etai fix, double hobe na ***

module.exports.onChat = async ({ api, event }) => {
  if (!event.body) return;

  // double call atkate
  if (handled.has(event.messageID)) return;
  handled.add(event.messageID);
  setTimeout(() => handled.delete(event.messageID), 5000);

  // bot er msg e reply dile
  if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) {
    const reply = await getAIReply(event.body, event.senderID);
    return api.sendMessage(reply, event.threadID, event.messageID);
  }

  const body = event.body.toLowerCase();
  if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") || body.startsWith("jan")) {
    const arr = body.replace(/^\S+\s*/, "").trim();
    if (!arr) return api.sendMessage(toFancy("Humm bolo, sunci..."), event.threadID, event.messageID);
    const reply = await getAIReply(arr, event.senderID);
    return api.sendMessage(reply, event.threadID, event.messageID);
  }
};
