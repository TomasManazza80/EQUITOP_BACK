const express = require("express");
const router = express.Router();
const clientController = require("../controller/clientController");

router.post("/clientes", clientController.createClient);
router.get("/clientes", clientController.getAllClients);
router.put("/clientes/:id", clientController.updateClient);
router.delete("/clientes/:id", clientController.deleteClient);

module.exports = router;
