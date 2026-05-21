var express = require('express');
var router = express.Router();
var devolucionController = require('../../controller/devolucionProductos/devolucionProductosController');

// --- ENDPOINTS DE LOGÍSTICA REVERSA EQUITOP ---
router.post('/registrarDevolucion', devolucionController.createEntry);
router.post('/registrarDevolucionCliente', devolucionController.createCustomerReturn);
router.get('/historialDevoluciones', devolucionController.getAllEntries);
router.delete('/:id', devolucionController.deleteEntry);

module.exports = router;