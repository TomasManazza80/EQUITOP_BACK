const express = require('express');
const paymentController = require('../controller/paymentController.js');

const router = express.Router();

// ENDPOINTS DE TRANSACCIÓN
router.post('/create_payment', paymentController.createPayment);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;