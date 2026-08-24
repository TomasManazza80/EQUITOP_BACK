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

    async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre } = req.body;
            const category = await categoryService.updateCategory(id, nombre);
            res.status(200).json({ message: 'Categoría actualizada con éxito', category });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error al actualizar la categoría' });
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

    async addSubcategory(req, res) {
        try {
            const { id } = req.params;
            const { subcategoryName } = req.body;
            const category = await categoryService.addSubcategory(id, subcategoryName);
            res.status(200).json({ message: 'Subcategoría agregada', category });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error al agregar subcategoría' });
        }
    },

    async removeSubcategory(req, res) {
        try {
            const { id } = req.params;
            const { subcategoryName } = req.body;
            const category = await categoryService.removeSubcategory(id, subcategoryName);
            res.status(200).json({ message: 'Subcategoría eliminada', category });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error al eliminar subcategoría' });
        }
    },

    async addSubcategoryGlobal(req, res) {
        try {
            const { subcategoryName, categoryId } = req.body;
            const category = await categoryService.addSubcategory(categoryId, subcategoryName);
            res.status(200).json({ message: 'Subcategoría agregada con éxito', category });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error al agregar subcategoría' });
        }
    },

    async updateSubcategoryGlobal(req, res) {
        try {
            const { oldSubcategoryName, newSubcategoryName } = req.body;
            await categoryService.updateSubcategoryGlobal(oldSubcategoryName, newSubcategoryName);
            res.status(200).json({ message: 'Subcategoría actualizada con éxito' });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error al actualizar subcategoría' });
        }
    },

    async removeSubcategoryGlobal(req, res) {
        try {
            const { subcategoryName } = req.body;
            await categoryService.removeSubcategoryGlobal(subcategoryName);
            res.status(200).json({ message: 'Subcategoría eliminada con éxito de todas las categorías' });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error al eliminar subcategoría' });
        }
    },
};

export default categoryController;