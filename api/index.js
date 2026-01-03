const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

// Internal Access Token State
let _at_val = crypto.randomUUID
  ? crypto.randomUUID()
  : crypto.randomBytes(16).toString("hex");
setInterval(() => {
  _at_val = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}, 30 * 60 * 1000); // 30 minutes rotation

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Obscured endpoint to fetch session token
app.get("/api/v1/auth/session", (req, res) => {
  res.json({ _sid: _at_val });
});

// Obscured endpoint for multi-service execution
app.get("/api/v1/proc/exec", async (req, res) => {
    // _px = url, _tk = token, _op = mode, _ql = quality
    const { _px, _tk, _op, _ql } = req.query; 

    // Custom Header Check
    const customHeader = req.headers["x-evm-source"];
    if (customHeader !== "verified-app" || _tk !== _at_val) {
      return res.status(403).json({ error: "Access Denied - Security Check Failed" });
    }

    try {
      const rawLink = Buffer.from(_px, "base64").toString("utf8");
      let targetUrl = "";

      // Internal Obfuscated Operation Mapping:
      // a1 = mp3, b2 = mp4, c3 = tiktok, d4 = fb, e5 = tw, f6 = capcut, g7 = gdrive
      if (_op === "a1") {
        try {
          // Use provided quality or default to 128
          const q = _ql || "128";
          targetUrl = `https://api.vreden.my.id/api/v1/download/youtube/audio?url=${encodeURIComponent(rawLink)}&quality=${q}`;
          const response = await axios.get(targetUrl, { timeout: 15000 });
          return res.json(response.data);
        } catch (e) {
          targetUrl = `https://sadas-ytmp3-5.vercel.app/convert?link=${encodeURIComponent(rawLink)}`;
        }
      } else if (_op === "b2") {
        try {
          // Use provided quality or default to 360
          const q = _ql || "360";
          targetUrl = `https://api.vreden.my.id/api/v1/download/youtube/video?url=${encodeURIComponent(rawLink)}&quality=${q}`;
          const response = await axios.get(targetUrl, { timeout: 15000 });
          return res.json(response.data);
        } catch (e) {
          targetUrl = `https://sadas-ytmp4-5.vercel.app/convert?link=${encodeURIComponent(rawLink)}`;
        }
      } else {

        switch (_op) {
          case "c3":
            targetUrl = `https://darksadasyt-tiktokdl.vercel.app/api/tiktok?q=${encodeURIComponent(rawLink)}`;
            break;
          case "d4":
            targetUrl = `https://darksadasyt-fbdl.vercel.app/api/fb-download?q=${encodeURIComponent(rawLink)}`;
            break;
          case "e5":
            targetUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/twiter?url=${encodeURIComponent(rawLink)}`;
            break;
          case "f6":
            targetUrl = `https://api.vreden.my.id/api/v1/download/capcut?url=${encodeURIComponent(rawLink)}`;
            break;
          case "g7":
            targetUrl = `https://api.vreden.my.id/api/v1/download/gdrive?url=${encodeURIComponent(rawLink)}`;
            break;
          default:
            return res.status(400).json({ error: "Invalid Op" });
        }
      }

      const response = await axios.get(targetUrl, { timeout: 20000 });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Service unavailable.", debug: error.message });
    }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
