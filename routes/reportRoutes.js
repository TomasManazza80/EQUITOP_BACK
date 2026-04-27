import express from 'express';
import reportController from '../controller/reportController.js';

const router = express.Router();

// GET /reports/ganancias-netas?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/ganancias-netas', reportController.getNetProfit);

export default router;