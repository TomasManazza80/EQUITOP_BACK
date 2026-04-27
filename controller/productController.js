const productService = require('../services/productService');

const productController = {
  async createProduct(req, res) {
    try {
      const payload = req.body;
      if (Array.isArray(payload)) {
        if (payload.length === 0) return res.status(400).json({ message: 'Arreglo vacío' });
        const result = await productService.createBulkProducts(payload);
        return res.status(201).json({ message: `${result.length} productos creados`, data: result });
      }

      const result = await productService.createSingleProduct(payload);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: 'Error en la creación', error: error.message });
    }
  },

  async updateProduct(req, res) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
  },

  async getAllProducts(req, res) {
    try {
      const { limit, page, search } = req.query;
      const result = await productService.getAllProducts(limit, page, search);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener productos' });
    }
  },

  async getProductById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async updateQuantityProduct(req, res) {
    try {
      // Pasamos todo el body para que el servicio reciba quantityToDiscount, color y almacenamiento
      const updated = await productService.updateQuantityProduct(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteProduct(req, res) {
    try {
      // Extraemos la contraseña del body (si se envía)
      const { adminPassword } = req.body;
      await productService.deleteProduct(req.params.id, adminPassword);
      res.status(204).send();
    } catch (error) {
      if (error.message === 'STOCK_EXISTENTE_REQ_PASS') {
        return res.status(403).json({
          message: 'El producto tiene stock. Se requiere contraseña de administrador.',
          code: 'REQUIRE_ADMIN_PASS'
        });
      }
      if (error.message === 'PASSWORD_INCORRECTO') {
        return res.status(401).json({ message: 'Contraseña de administrador incorrecta.' });
      }
      res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
  }
};

module.exports = productController;