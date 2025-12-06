require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("./models/article");

async function clearDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Article.deleteMany({});
  console.log("✅ All articles deleted.");
  await mongoose.disconnect();
}

clearDB();
