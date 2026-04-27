const express = require('express');
const router = express.Router();
const gastosController = require('../controller/gastosController');

// Shipping Rates
router.get('/shipping-rates', gastosController.getShippingRates);
router.post('/shipping-rates', gastosController.updateShippingRate);

// Bank Rates
router.get('/bank-rates', gastosController.getBankRates);
router.post('/bank-rates', gastosController.createBankRate);
router.delete('/bank-rates/:id', gastosController.deleteBankRate);

// Price Updates
router.post('/update-prices', gastosController.updatePrices);
router.post('/preview-products', gastosController.previewProducts);

// Global Configs
router.get('/global-configs', gastosController.getGlobalConfigs);
router.post('/global-configs', gastosController.updateGlobalConfigs);

module.exports = router;
