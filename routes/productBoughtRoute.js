// routes/productRouter.js
const express = require('express');
const ProductBoughtController = require('../controller/productBoughtController');

const router = express.Router();

router.post('/boughtProduct', ProductBoughtController.createProduct);
router.delete('/:id', ProductBoughtController.deleteBoughtProduct);
router.get('/AllboughtProducts', ProductBoughtController.getProducts);
router.put('/:id', ProductBoughtController.updateProduct);


module.exports = router;