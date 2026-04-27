const ProductBoughtService = require('../services/productBoughtService');

const ProductController = {
  async createProduct(req, res) {
    try {
      const product = await ProductBoughtService.createBoughtProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Error al crear producto' });
    }
  },

  async getProducts(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const products = await ProductBoughtService.getAllBoughtProducts(startDate, endDate);
      res.status(200).json(products);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).send('Error al obtener productos');
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductBoughtService.updateBoughtProduct(id, req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar producto' });
    }
  },


  async deleteBoughtProduct(req, res) {
    console.log("esta es el id***********", req.params);
    try {
      const { id } = req.params; // obtiene el ID del producto desde la ruta
      await ProductBoughtService.deleteProduct(id); // llama al servicio para eliminar el producto
      res.status(204).json({ message: 'Producto eliminado con éxito' });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    }
  }
};

module.exports = ProductController;
