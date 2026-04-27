const express = require("express");
const router = express.Router();
const { createRecaudationController, deleteRecaudationController, getRecaudationsController } = require("../controller/recaudationController");

router.post("/recaudation", createRecaudationController);
router.delete("/recaudation/:id", deleteRecaudationController);
router.get("/recaudations", getRecaudationsController);

module.exports = router;