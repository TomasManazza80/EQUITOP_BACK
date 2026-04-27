var express = require('express');
var router = express.Router();
var productController = require('../controller/productController');

// Esta única ruta ahora maneja la creación simple Y la carga masiva.
router.post('/products', productController.createProduct);

router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.put('/products/:id', productController.updateProduct);
router.put('/products/update-quantity/:id', productController.updateQuantityProduct);
router.delete('/products/:id', productController.deleteProduct);

module.exports = router;