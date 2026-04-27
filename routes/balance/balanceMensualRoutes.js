var express = require('express');
var router = express.Router();
var balanceMensualController = require('../../controller/balance/balanceMensual');

router.post('/CreaBalanceMensual', balanceMensualController.createEntry);
router.get('/ObtenBalanceMensual', balanceMensualController.getAllEntries);
router.get('/ObtenBalanceMensual/:id', balanceMensualController.getEntryById);
router.put('/ActualizaBalanceMensual/:id', balanceMensualController.updateEntry);
router.delete('/BorraBalanceMensual/:id', balanceMensualController.deleteEntry);
router.delete('/BorraTodoBalanceMensual', balanceMensualController.deleteAllEntries);

module.exports = router;