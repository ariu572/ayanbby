module.exports = {
config: {
name: "adminmention",
version: "1.7.0",
author: "〲MAMUNツ࿐ T.T　o.O",
countDown: 0,
role: 0,
shortDescription: "Admin mention roast",
longDescription: "Roasts users who mention admins and tags them by Facebook name.",
category: "system"
},

onStart: async function () {},

onChat: async function ({ event, message, api }) {
try {
const adminIDs = [
"61594650721376",
"61594483543086",
"61593818074328",
"61588177739816"
];

  if (!event || !event.senderID) return;

  const senderID = String(event.senderID);

  // Admin messages skip
  if (adminIDs.includes(senderID)) return;

  // Check admin mentions
  const mentions = event.mentions || {};
  const mentionedIDs = Object.keys(mentions).map(String);

  const isMentioningAdmin = adminIDs.some(id =>
    mentionedIDs.includes(id)
  );

  if (!isMentioningAdmin) return;

  const REPLIES = [
    "🐸 ওই মিয়া! বসরে মেনশন দেস ক্যান? তোরে কি দাওয়াত দিছে? 😒",
    "😈 এই বেডা! বসরে ডাকাডাকি বন্ধ কর, বস তোর পাড়ার মাইক না! 😂",
    "💀 বসরে মেনশন দিয়া কী প্রমাণ করতে চাস? 🤣",
    "🤨 এই পাগলা! বসরে ডাকিস কেন? 🐸",
    "🔥 ওস্তাদ, বসরে মেনশন না দিয়া নিজের কপালে একটা মেনশন দে! 🤣",
    "😏 VIP-এর নকল ভার্সন, বসরে অযথা ডাকিস না! 👑",
    "🐸 বসরে মেনশন দিস কেন? বুদ্ধি কি ছুটিতে গেছে? 😂",
    "😈 বসরে মেনশন দিয়া লাভ নাই, তোর নাটক দেখার সময় নাই! 💀",
    "🤡 ওই মেনশনবাজ! বস কি তোর পাড়ার বন্ধু নাকি? 😂",
    "💥 বেশি মেনশন মারিস না, ভাই! 😏",
    "😭 ভাই, বসরে এত ডাকিস কেন? প্রেমে পড়ছিস নাকি? 😂",
    "🐸 মেনশন মারা বন্ধ কর, নোটিফিকেশনও শান্তিতে থাকুক! 🤣",
    "👑 বসের নাম নেওয়ার আগে নিজের লেভেল দেখ! 😈",
    "💀 বসরে মেনশন দেস, আর ভাবিস বস তোকে পাত্তা দিবে? 😂",
    "😎 মেনশন দিতে থাক, একদিন মশাও রিপ্লাই দিবে! 🦟",
    "🤨 বস কি তোর ২৪ ঘণ্টার কাস্টমার কেয়ার? 📞😂",
    "🔥 বসরে মেনশন দিয়ে হিরো হইস না! 🤡",
    "🐸 তোর মেনশন দেখে মনে হয় বসের সাথে জমিজমার মামলা আছে! 😂",
    "😈 এইবার থাম, মেনশনবাজ! 🤣",
    "💀 বসরে এমনভাবে ডাকিস, মনে হয় টাকা ধার নিছিস! 😂"
  ];

  const randomReply =
    REPLIES[Math.floor(Math.random() * REPLIES.length)];

  // Get actual Facebook name
  let senderName = event.senderName || "";

  if (api && typeof api.getUserInfo === "function") {
    try {
      const userInfo = await api.getUserInfo(senderID);

      if (userInfo && userInfo[senderID] && userInfo[senderID].name) {
        senderName = userInfo[senderID].name;
      }
    } catch (e) {
      console.error("[adminmention] Name lookup failed:", e.message);
    }
  }

  if (!senderName) senderName = "ভাই";

  // Reply with clickable mention of the sender
  return await message.reply({
    body: `@${senderName}, ${randomReply}`,
    mentions: [
      {
        id: senderID,
        tag: `@${senderName}`
      }
    ]
  });

} catch (error) {
  console.error("[adminmention] Error:", error);
}

}
};
