const express = require('express');
const router = express.Router();
const dispatchController = require('../../controller/ventasEcommerceController');

console.log('Rutas de Ecommerce (/ecommerce/pedidos) cargadas correctamente.');

// URL: http://localhost:3000/ecommerce/pedidos
router.get('/pedidos', dispatchController.getAll);
router.post('/pedidos', dispatchController.createDispatch);
router.patch('/pedidos/:id/estado', dispatchController.updateStatus);
router.delete('/pedidos/:id', dispatchController.delete);

module.exports = router;