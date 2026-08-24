import express from 'express';
import categoryController from '../controller/categoryController.js';

const router = express.Router();

router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.post('/subcategories', categoryController.addSubcategoryGlobal);
router.put('/subcategories', categoryController.updateSubcategoryGlobal);
router.delete('/subcategories', categoryController.removeSubcategoryGlobal);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);
router.post('/:id/subcategories', categoryController.addSubcategory);
router.delete('/:id/subcategories', categoryController.removeSubcategory);

export default router;