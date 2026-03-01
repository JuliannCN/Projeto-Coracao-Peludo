const express = require("express");
const router = express.Router();
const animalController = require("../controllers/animalController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", animalController.getAll);
router.post("/", authMiddleware, animalController.create);

module.exports = router;