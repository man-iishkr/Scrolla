const path = require("path");
const express = require("express");

const app = express();

/* middlewares */
app.use(express.json());

/* ✅ SERVE FRONTEND */
app.use(express.static(path.join(__dirname, "../public")));

/* API routes */
app.use("/api/feed", require("./routes/feedRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

/* ✅ FALLBACK: serve index.html */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

module.exports = app;
