const express = require('express');
const router = express.Router();
const debtController = require('../../controller/balance/deudaPersonalController');

// Definición de Endpoints de Control de Deuda
router.get('/obtenerDeudas', debtController.getAll);
router.post('/crearDeuda', debtController.create);
router.put('/actualizarDeuda/:id', debtController.update);
router.delete('/eliminarDeuda/:id', debtController.delete);

module.exports = router;
