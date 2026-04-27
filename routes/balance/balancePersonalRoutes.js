var express = require('express');
var router = express.Router();
var balancePersonalController = require('../../controller/balance/balancePersonalController.js');

router.post('/crearBalancePersonal', balancePersonalController.createEntry);
router.get('/obtenerBalancePersonal', balancePersonalController.getAllEntries);
router.put('/actualizarBalancePersonal/:id', balancePersonalController.updateEntry);
router.delete('/eliminarBalancePersonal/:id', balancePersonalController.deleteEntry);
router.get('/obtenerResponsables', balancePersonalController.getResponsables);

module.exports = router;