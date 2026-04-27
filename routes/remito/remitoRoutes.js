var express = require('express');
var router = express.Router();
var remitoController = require('../../controller/remito/remitoController.js');

// Base: http://localhost:3000/remito
router.post('/crearRemito', remitoController.createEntry);
router.get('/historialRemitos', remitoController.getAllEntries);
router.put('/liquidarPago/:id', remitoController.updatePayment);

module.exports = router;