import categoryService from '../services/categoryService.js';

const categoryController = {
    async create(req, res) {
        try {
            const { category, created } = await categoryService.createCategory(req.body);
            if (!created) {
                // Si la categoría ya existe, la retornamos con un código de 'conflicto'
                return res.status(409).json({ message: 'La categoría ya existe.', category });
            }
            // Si es nueva, la retornamos con un código de 'creado'
            res.status(201).json(category);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear la categoría', error: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const categories = await categoryService.getAllCategories();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener las categorías', error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await categoryService.deleteCategory(id);
            res.status(200).json({ message: 'Categoría eliminada con éxito.' });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error al eliminar la categoría' });
        }
    },
};

export default categoryController;