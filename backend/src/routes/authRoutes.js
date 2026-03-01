const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Auth funcionando" });
});

module.exports = router;