const router = require("express").Router();
const { getFeed } = require("../controllers/feedController");

router.get("/", getFeed);

module.exports = router;
