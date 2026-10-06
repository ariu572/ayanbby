// code from goatstore
// api: https://store.agi.bd
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const PASTEBIN_API = "https://pastebin-raw.vercel.app";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
const PAGE_SIZE = 100;
const BACK_REACTIONS = ["👍", "👍🏻", "like"];
const NEXT_REACTIONS = ["➡️", "➡", "right"];
const PREV_REACTIONS = ["⬅️", "⬅", "left"];

const ROOT_DIR = path.join(__dirname, "..", "..");
const COMMANDS_RELDIR = path.relative(ROOT_DIR, __dirname).split(path.sep).join("/");
const IGNORE_NAMES = new Set(["node_modules", ".git", ".env", "package-lock.json"]);

const SMALL_CAPS_MAP = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ",
    j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ",
    s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
};

function styleWord(word) {
    if (!word) return word;
    const first = word[0];
    const rest = word.slice(1).toLowerCase().split("").map(ch => SMALL_CAPS_MAP[ch] || ch).join("");
    return first + rest;
}

function styleText(str) {
    return str.split(" ").map(styleWord).join(" ");
}

function isImageFile(name) {
    return IMAGE_EXTENSIONS.includes(path.extname(name).toLowerCase());
}

function extractUrl(text) {
    const match = (text || "").match(/https?:\/\/[^\s)>\]]+/i);
    return match ? match[0].replace(/[.,;!?]+$/, "") : null;
}

function extractCommandName(code) {
    const match = code.match(/name\s*:\s*["'`]([^"'`]+)["'`]/);
    return match ? match[1] : null;
}

function installCommandFromCode(code) {
    try {
        new Function(code);
    } catch (e) {
        return { ok: false, error: `Syntax error in fetched code: ${e.message}` };
    }

    const cmdName = extractCommandName(code);
    const fileName = `${cmdName || "cmd_" + Date.now()}.js`;
    const fullPath = path.join(ROOT_DIR, COMMANDS_RELDIR, fileName);

    try {
        fs.writeFileSync(fullPath, code, "utf8");
    } catch (e) {
        return { ok: false, error: `Couldn't write the file: ${e.message}` };
    }

    let cmd;
    try {
        delete require.cache[require.resolve(fullPath)];
        cmd = require(fullPath);
    } catch (e) {
        fs.unlinkSync(fullPath);
        return { ok: false, error: `Failed to load fetched code: ${e.message}` };
    }

    if (!cmd || typeof cmd !== "object" || !cmd.config || typeof cmd.onStart !== "function") {
        fs.unlinkSync(fullPath);
        return { ok: false, error: "That link isn't a valid command file (missing config or onStart)." };
    }

    const finalName = cmd.config.name || cmdName || fileName;

    try {
        if (global.GoatBot && typeof global.GoatBot.autoloadCommand === "function") {
            global.GoatBot.autoloadCommand({ filePath: fullPath, name: finalName });
        } else if (global.GoatBot && global.GoatBot.commands) {
            global.GoatBot.commands.set(finalName, cmd);
            if (Array.isArray(cmd.config.aliases) && global.GoatBot.aliases) {
                cmd.config.aliases.forEach(a => global.GoatBot.aliases.set(a, finalName));
            }
        }
        return { ok: true, name: finalName, fileName };
    } catch (e) {
        return { ok: false, error: `Installed as ${fileName} but failed to hot-reload: ${e.message} (a restart may be needed)` };
    }
}

function listDir(dirAbs) {
    let names;
    try {
        names = fs.readdirSync(dirAbs);
    } catch (e) {
        return { entries: [], error: e.message };
    }

    const entries = names
        .filter(name => !name.startsWith(".") && !IGNORE_NAMES.has(name))
        .map(name => {
            const full = path.join(dirAbs, name);
            let stat;
            try {
                stat = fs.statSync(full);
            } catch (e) {
                return null;
            }
            return {
                name,
                isDir: stat.isDirectory(),
                isImage: !stat.isDirectory() && isImageFile(name)
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });

    return { entries, error: null };
}

function instructions(lines) {
    let msg = `╭─✦    Options    ✦─╮\n`;
    lines.forEach(l => (msg += `│ ${styleText(l)}\n`));
    msg += `╰───────────────────╯`;
    return msg;
}

function totalPages(entriesLength) {
    return Math.max(1, Math.ceil(entriesLength / PAGE_SIZE));
}

function renderList(relDir, entries, titleOverride, page) {
    page = page || 1;
    const pages = totalPages(entries.length);
    if (page > pages) page = pages;
    if (page < 1) page = 1;

    const title = titleOverride || (relDir ? relDir.split("/").pop() : "root");
    let msg = `🗂️ 『 ${title} 』`;
    if (pages > 1) msg += ` (page ${page}/${pages})`;
    msg += `\n`;

    const start = (page - 1) * PAGE_SIZE;
    const shown = entries.slice(start, start + PAGE_SIZE);
    shown.forEach((e, idx) => {
        const num = start + idx + 1;
        const branch = idx === shown.length - 1 ? "└" : "├";
        const icon = e.isDir ? "📂" : (e.isImage ? "🖼️" : "📄");
        msg += `${branch}${num}. ${icon} ${e.name}\n`;
    });
    if (entries.length === 0) msg += "『 empty 』\n";

    const hasFiles = shown.some(e => !e.isDir);

    const optLines = [];
    if (shown.length > 0) optLines.push("Reply a number to open");
    if (relDir) optLines.push("React 👍🏻 to go back");
    if (page < pages) optLines.push("React ➡️ for next page");
    if (page > 1) optLines.push("React ⬅️ for previous page");
    if (shown.length > 0) optLines.push('Reply "d" to delete');
    if (hasFiles) optLines.push('Reply "r" for raw links');

    msg += `\n${instructions(optLines)}`;
    return msg;
}

function registerListState(messageID, state) {
    global.GoatBot.onReply.set(messageID, state);
    global.GoatBot.onReaction.set(messageID, state);
}

function refreshPage(api, state, newPage) {
    const relDir = state.relDir || "";
    const entries = state.entries || [];
    const titleOverride = state.titleOverride;
    const newContent = renderList(relDir, entries, titleOverride, newPage);
    api.editMessage(newContent, state.messageID, () => {
        registerListState(state.messageID, {
            ...state,
            page: newPage
        });
    });
}

async function goBack(api, event, state) {
    const relDir = state.relDir || "";
    if (!relDir) return;

    const parent = relDir.includes("/") ? relDir.slice(0, relDir.lastIndexOf("/")) : "";
    const parentAbs = path.join(ROOT_DIR, parent);
    const { entries: parentEntries, error } = listDir(parentAbs);
    if (error) {
        return api.sendMessage(`❌ Couldn't read that folder: ${error}`, event.threadID);
    }

    const newContent = renderList(parent, parentEntries, null, 1);
    api.editMessage(newContent, state.messageID, () => {
        registerListState(state.messageID, {
            commandName: "file",
            messageID: state.messageID,
            author: state.author,
            relDir: parent,
            entries: parentEntries,
            page: 1
        });
    });
}

module.exports = {
  config: {
    name: "file",
    aliases: ["files", "fm"],
    version: "2.3.0",
    author: "rX",
    countDown: 5,
    role: 1,
    shortDescription: "Browse/manage command files",
    longDescription: "Browse, view (with image preview), and delete files/folders across the bot's project (commands, events, etc). Supports pagination for large folders.",
    category: "system",
    guide: {
      en:
        "{pn} — show all files/folders in the commands folder\n" +
        "{pn} start <text> — filter files starting with text\n" +
        "{pn} ext <text> — filter files by extension\n" +
        "{pn} <text> — filter files containing text\n" +
        "{pn} -in — reply to a message containing a raw link to install it as a command and hot-reload\n" +
        "{pn} help — show this guide\n" +
        "Reply a number to open a folder or preview an image\n" +
        "React 👍🏻 on the listing to go up a level\n" +
        "React ➡️ / ⬅️ to page through large listings (100 per page)\n" +
        "Reply \"d 1,2,3\" to delete\n" +
        "Reply \"r 1,2,3\" to get paste links for those files"
    }
  },

  onReaction: async function ({ api, event, Reaction }) {
    if (!Reaction) return;
    if (event.userID != Reaction.author) return;
    if (Reaction.stage === "viewFile") return;

    const reactionIcon = (event.reaction || "").toString().toLowerCase();

    if (BACK_REACTIONS.some(r => reactionIcon === r.toLowerCase())) {
        return goBack(api, event, Reaction);
    }

    const entries = Reaction.entries || [];
    const pages = totalPages(entries.length);
    const currentPage = Reaction.page || 1;

    if (NEXT_REACTIONS.some(r => reactionIcon === r.toLowerCase())) {
        if (currentPage >= pages) return;
        return refreshPage(api, Reaction, currentPage + 1);
    }

    if (PREV_REACTIONS.some(r => reactionIcon === r.toLowerCase())) {
        if (currentPage <= 1) return;
        return refreshPage(api, Reaction, currentPage - 1);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID != Reply.author) return;
    const body = (event.body || "").trim();

    if (Reply.stage === "viewFile") {
        if (!["r", "raw"].includes(body.toLowerCase())) {
            return api.sendMessage('❌ Reply "r" to get a paste link, or ignore this message.', event.threadID, event.messageID);
        }
        const abs = path.join(ROOT_DIR, Reply.filePath);
        let code;
        try {
            code = fs.readFileSync(abs, "utf8");
        } catch (e) {
            return api.sendMessage("❌ Couldn't read that file (it may have been deleted).", event.threadID, event.messageID);
        }
        try {
            const res = await axios.post(`${PASTEBIN_API}/api/paste`, { code });
            if (res.data && res.data.url) {
                return api.sendMessage(`📄 File: ${path.basename(Reply.filePath)}\n🔗 ${res.data.url}`, event.threadID, event.messageID);
            }
            return api.sendMessage("⚠️ Upload failed - no valid link received.", event.threadID, event.messageID);
        } catch (e) {
            const detail = e.response
                ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data).slice(0, 300)}`
                : e.message;
            return api.sendMessage("❌ Upload failed: " + detail, event.threadID, event.messageID);
        }
    }

    const relDir = Reply.relDir || "";
    const dirAbs = path.join(ROOT_DIR, relDir);
    const entries = Reply.entries || [];
    const page = Reply.page || 1;
    const pageOffset = (page - 1) * PAGE_SIZE;

    if (body.toLowerCase() === "back") {
        if (!relDir) return api.sendMessage("⚡️Already at the project root.", event.threadID, event.messageID);
        return goBack(api, event, Reply);
    }

    const deleteMatch = body.match(/^(?:d|delete)(?:\s+(.+))?$/i);
    if (deleteMatch) {
        let nums;
        if (deleteMatch[1]) {
            nums = deleteMatch[1].trim().split(/[\s,]+/).map(n => parseInt(n, 10));
        } else if (entries.length === 1) {
            nums = [1];
        } else {
            return api.sendMessage('❌ More than one item here — reply "d 1,2,3" with the number(s) to delete.', event.threadID, event.messageID);
        }
        const lines = [];
        for (const num of nums) {
            if (!Number.isInteger(num)) { lines.push(`❌ "${num}" invalid`); continue; }
            const target = entries[num - 1];
            if (!target) { lines.push(`❌ ${num} invalid`); continue; }
            const full = path.join(dirAbs, target.name);
            try {
                if (target.isDir) fs.rmSync(full, { recursive: true, force: true });
                else fs.unlinkSync(full);
                lines.push(`${target.isDir ? "📂" : "📄"} ${target.name} deleted`);
            } catch (err) {
                lines.push(`❌ Failed: ${target.name} (${err.message})`);
            }
        }
        return api.sendMessage(`⚡️Done:\n\n${lines.join("\n")}`, event.threadID, event.messageID);
    }

    const rawMatch = body.match(/^(?:r|raw)(?:\s+(.+))?$/i);
    if (rawMatch) {
        let nums;
        if (rawMatch[1]) {
            nums = rawMatch[1].trim().split(/[\s,]+/).map(n => parseInt(n, 10));
        } else if (entries.length === 1 && !entries[0].isDir) {
            nums = [1];
        } else if (entries.length === 1 && entries[0].isDir) {
            return api.sendMessage("❌ That's a folder — raw links only work for files.", event.threadID, event.messageID);
        } else {
            return api.sendMessage('❌ More than one item here — reply "r 1,2,3" with the number(s) for raw links.', event.threadID, event.messageID);
        }
        const fileLines = [];
        const resultLines = [];
        for (const num of nums) {
            if (!Number.isInteger(num)) { fileLines.push(`#${num}`); resultLines.push(`"${num}" invalid`); continue; }
            const target = entries[num - 1];
            if (!target) { fileLines.push(`#${num}`); resultLines.push(`${num} invalid`); continue; }
            if (target.isDir) { fileLines.push(target.name); resultLines.push(`${target.name} is a folder, skipped`); continue; }
            if (target.isImage) { fileLines.push(target.name); resultLines.push(`${target.name} is an image, skipped`); continue; }
            const full = path.join(dirAbs, target.name);
            let code;
            try {
                code = fs.readFileSync(full, "utf8");
            } catch (e) {
                fileLines.push(target.name);
                resultLines.push(`${target.name} couldn't be read`);
                continue;
            }
            try {
                const res = await axios.post(`${PASTEBIN_API}/api/paste`, { code });
                if (res.data && res.data.url) {
                    fileLines.push(target.name);
                    resultLines.push(res.data.url);
                } else {
                    fileLines.push(target.name);
                    resultLines.push(`${target.name} upload failed, no link received`);
                }
            } catch (err) {
                const detail = err.response
                    ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data).slice(0, 200)}`
                    : err.message;
                fileLines.push(target.name);
                resultLines.push(`${target.name} upload failed: ${detail}`);
            }
        }

        let out = `╭─‣ File\n`;
        fileLines.forEach(f => (out += `├‣ ${f}\n`));
        out += `╰────────────◊\n`;
        resultLines.forEach(r => (out += `  • ${r}\n`));
        return api.sendMessage(out.trimEnd(), event.threadID, event.messageID);
    }

    const num = parseInt(body, 10);
    if (!Number.isInteger(num) || !entries[num - 1]) {
        return api.sendMessage('❌ Invalid reply. Send a number, react 👍🏻 to go back / ➡️⬅️ to page, or "d 1,2,3" / "r 1,2,3".', event.threadID, event.messageID);
    }
    const entry = entries[num - 1];
    const entryAbs = path.join(dirAbs, entry.name);
    const newRelDir = relDir ? `${relDir}/${entry.name}` : entry.name;

    if (entry.isDir) {
        const { entries: subEntries, error } = listDir(entryAbs);
        if (error) return api.sendMessage(`❌ Couldn't read that folder: ${error}`, event.threadID, event.messageID);
        return api.sendMessage(renderList(newRelDir, subEntries, null, 1), event.threadID, (e, info) => {
            if (e || !info) return;
            registerListState(info.messageID, {
                commandName: "file",
                messageID: info.messageID,
                author: event.senderID,
                relDir: newRelDir,
                entries: subEntries,
                page: 1
            });
            deleteOldPage(api, Reply);
        });
    }

    if (entry.isImage) {
        return api.sendMessage(
            { body: `🖼️ ${entry.name}`, attachment: fs.createReadStream(entryAbs) },
            event.threadID,
            (e, info) => {
                if (e) return;
                deleteOldPage(api, Reply);
            },
            event.messageID
        );
    }

    return api.sendMessage(
        `📄 ${entry.name}\n${instructions(['Reply "r" to get a paste link for this file', "Or use the delete command to remove it"])}`,
        event.threadID,
        (e, info) => {
            if (e || !info) return;
            global.GoatBot.onReply.set(info.messageID, {
                commandName: "file",
                messageID: info.messageID,
                author: event.senderID,
                stage: "viewFile",
                filePath: newRelDir
            });
            deleteOldPage(api, Reply);
        },
        event.messageID
    );
  },

  onStart: async function ({ api, event, args }) {
    if (args[0] === "help") {
        return api.sendMessage(
`How to use:
•start <text> — filter files starting with text
•ext <text> — filter files by extension
•<text> — filter files containing text
•(blank) — show all files/folders
•-in — reply to a message containing a raw link to install it as a command and hot-reload
•Reply a number to open a folder or preview an image
•React 👍🏻 on the listing to go up a level
•React ➡️ / ⬅️ to page through large listings (100 per page)
•Reply "d 1,2,3" to delete
•Reply "r 1,2,3" to get paste links for those files`,
            event.threadID, event.messageID);
    }

    if (args[0] === "-in") {
        const quoted = event.messageReply;
        if (!quoted || !quoted.body) {
            return api.sendMessage('❌ Reply to a message that contains a raw link with "file -in" to install it.', event.threadID, event.messageID);
        }
        const url = extractUrl(quoted.body);
        if (!url) {
            return api.sendMessage("❌ Couldn't find a link in that message.", event.threadID, event.messageID);
        }

        let code;
        try {
            const res = await axios.get(url, { responseType: "text", transformResponse: [d => d] });
            code = res.data;
        } catch (e) {
            const detail = e.response ? `HTTP ${e.response.status}` : e.message;
            return api.sendMessage(`❌ Couldn't fetch that link: ${detail}`, event.threadID, event.messageID);
        }

        if (!code || !code.trim()) {
            return api.sendMessage("❌ That link returned empty content.", event.threadID, event.messageID);
        }

        const result = installCommandFromCode(code);
        if (!result.ok) {
            return api.sendMessage(`❌ ${result.error}`, event.threadID, event.messageID);
        }
        return api.sendMessage(`✅ Installed & reloaded: ${result.name} (${result.fileName})`, event.threadID, event.messageID);
    }

    const { entries: allEntries, error } = listDir(path.join(ROOT_DIR, COMMANDS_RELDIR));
    if (error) return api.sendMessage(`❌ Couldn't read the commands folder: ${error}`, event.threadID, event.messageID);

    let entries = allEntries;
    let key = "All files/folders in commands";

    if (args[0] === "start" && args[1]) {
        const word = args.slice(1).join(" ");
        entries = entries.filter(e => e.name.toLowerCase().startsWith(word.toLowerCase()));
        key = `Files starting with: ${word}`;
    } else if (args[0] === "ext" && args[1]) {
        const ext = args[1].startsWith(".") ? args[1] : `.${args[1]}`;
        entries = entries.filter(e => !e.isDir && path.extname(e.name).toLowerCase() === ext.toLowerCase());
        key = `Files ending with: ${ext}`;
    } else if (args[0]) {
        const word = args.join(" ");
        entries = entries.filter(e => e.name.toLowerCase().includes(word.toLowerCase()));
        key = `Files containing: ${word}`;
    }

    if (entries.length === 0) return api.sendMessage("⚡️No matching files/folders found.", event.threadID, event.messageID);

    return api.sendMessage(renderList(COMMANDS_RELDIR, entries, key, 1), event.threadID, (e, info) => {
        if (e || !info) return;
        registerListState(info.messageID, {
            commandName: "file",
            messageID: info.messageID,
            author: event.senderID,
            relDir: COMMANDS_RELDIR,
            entries,
            titleOverride: key,
            page: 1
        });
    });
  }
};

function deleteOldPage(api, Reply) {
    if (!Reply || !Reply.messageID) return;
    try {
        api.unsendMessage(Reply.messageID, () => {});
    } catch (e) {}
  }
