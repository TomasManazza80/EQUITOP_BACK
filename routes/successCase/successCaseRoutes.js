import express from 'express';
import successCaseController from '../../controller/successCase/successCaseController.js';

const router = express.Router();

router.get('/get', successCaseController.getAll);
router.post('/post', successCaseController.create);
router.delete('/delete/:id', successCaseController.delete);

export default router;