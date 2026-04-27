import express from 'express';
import ventasEcommerceController from '../../controller/ventasEcommerceController.js';
import gastosController from '../../controller/gastosController.js';

const router = express.Router();

// GET /ecommerce/pedidos (Soporta ?unshipped=true)
router.get('/pedidos', ventasEcommerceController.getOrders);

// POST /ecommerce/pedidos (Crear orden al iniciar pago)
router.post('/pedidos', ventasEcommerceController.createOrder);

// PATCH /ecommerce/pedidos/:id/estado (Actualizar estado de envío)
router.patch('/pedidos/:id/estado', ventasEcommerceController.updateStatus);

// DELETE /ecommerce/pedidos/:id
router.delete('/pedidos/:id', ventasEcommerceController.delete);

// Rutas de configuración para el carrito (Shipping, Fees, etc.)
router.get('/shipping-rates', gastosController.getShippingRates);
router.get('/bank-rates', gastosController.getBankRates);
router.get('/global-configs', gastosController.getGlobalConfigs);

export default router;