var express = require('express');
var router = express.Router();
var productController = require('../controller/productController');

// Esta única ruta ahora maneja la creación simple Y la carga masiva.
router.post('/products', productController.createProduct);

// IMPORTANTE: La ruta de búsqueda por código de unidad DEBE ir antes de /products/:id
// para que "unit-barcode" no sea interpretado como un :id
router.get('/products/unit-barcode/:codigo', productController.findByUnitBarcode);

router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.put('/products/:id', productController.updateProduct);
router.put('/products/update-quantity/:id', productController.updateQuantityProduct);
router.delete('/products/:id', productController.deleteProduct);

// Códigos de barras por unidad individual
router.post('/products/:id/unit-barcodes', productController.addUnitBarcodes);
router.delete('/products/:id/unit-barcodes/:codigo', productController.removeUnitBarcode);

// Likes
router.post('/products/:id/like', productController.toggleLikeProduct);
router.get('/products/likes/user/:email', productController.getUserLikes);

module.exports = router;