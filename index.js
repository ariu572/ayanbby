const { spawn } = require("child_process");
const log = require("./logger/log.js");
const express = require("express");
const app = express();

function startProject() {
  const child = spawn("node", ["EryXenX.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    if (code == 2) {
      log.info("Restarting Project...");
      startProject();
    }
  });
}

startProject();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Uptime server running");
});
