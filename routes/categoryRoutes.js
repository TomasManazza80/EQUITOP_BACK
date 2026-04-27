import express from 'express';
import categoryController from '../controller/categoryController.js';

const router = express.Router();

router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.delete('/:id', categoryController.delete);

export default router;