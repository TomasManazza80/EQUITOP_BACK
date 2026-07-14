import { Category } from "../models/index.js";

const categoryService = {
    async getAllCategories() {
        try {
            // Basado en el error, el campo es 'categoryName'
            return await Category.findAll({
                order: [['categoryName', 'ASC']]
            });
        } catch (error) {
            console.error('Error al obtener las categorías:', error);
            throw error;
        }
    },

    async createCategory(data) {
        try {
            const { nombre } = data;
            if (!nombre || nombre.trim() === '') {
                throw new Error('El nombre de la categoría es requerido.');
            }
            // Usamos findOrCreate para evitar duplicados, convirtiendo a mayúsculas. El campo en la DB es 'categoryName'.
            const [category, created] = await Category.findOrCreate({
                where: { categoryName: nombre.trim().toUpperCase() },
                defaults: { categoryName: nombre.trim().toUpperCase() }
            });
            return { category, created };
        } catch (error) {
            console.error('Error al crear la categoría:', error);
            throw error;
        }
    },

    async deleteCategory(id) {
        try {
            const category = await Category.findByPk(id);
            if (!category) {
                throw new Error('La categoría no existe o ya fue eliminada.');
            }
            // Al tener 'paranoid: true' en el modelo, esto realizará un soft-delete (update deletedAt)
            await category.destroy();
            return true;
        } catch (error) {
            console.error('Error al eliminar la categoría:', error);
            throw error;
        }
    },
    async addSubcategory(categoryId, subcategoryName) {
        try {
            const category = await Category.findByPk(categoryId);
            if (!category) throw new Error('La categoría no existe.');
            
            const nameToInsert = subcategoryName.trim().toUpperCase();
            if (!nameToInsert) throw new Error('El nombre de la subcategoría es inválido.');

            // parse if string (sqlite edge case), or array
            let currentSubs = category.subcategories || [];
            if (typeof currentSubs === 'string') currentSubs = JSON.parse(currentSubs);

            if (!currentSubs.includes(nameToInsert)) {
                currentSubs.push(nameToInsert);
                category.subcategories = currentSubs;
                await category.save();
            }
            return category;
        } catch (error) {
            console.error('Error al agregar subcategoría:', error);
            throw error;
        }
    },

    async removeSubcategory(categoryId, subcategoryName) {
        try {
            const category = await Category.findByPk(categoryId);
            if (!category) throw new Error('La categoría no existe.');

            const nameToRemove = subcategoryName.trim().toUpperCase();
            let currentSubs = category.subcategories || [];
            if (typeof currentSubs === 'string') currentSubs = JSON.parse(currentSubs);

            category.subcategories = currentSubs.filter(sub => sub !== nameToRemove);
            await category.save();
            return category;
        } catch (error) {
            console.error('Error al eliminar subcategoría:', error);
            throw error;
        }
    },
};

export default categoryService;