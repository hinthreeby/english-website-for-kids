const express = require("express");
const router = express.Router();
const logger = require("../config/logger");

router.get("/", (req, res) => {
  logger.info("Test log created for ELK pipeline");
  res.json({ message: "Log created successfully" });
});

module.exports = router;
