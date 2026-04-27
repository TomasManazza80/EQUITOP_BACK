const express = require("express");
const router = express.Router();
const providerController = require("../controller/providerController");

router.post("/providers", providerController.createProvider);
router.get("/providers", providerController.getAllProviders);
router.put("/providers/:id", providerController.updateProvider);
router.delete("/providers/:id", providerController.deleteProvider);

module.exports = router;
