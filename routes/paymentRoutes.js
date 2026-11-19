import express from 'express';
import {
  createPayment,
  handleWebhook,
  getOrderStatus
} from '../controller/paymentController.js';

const router = express.Router();

router.post('/create_payment', createPayment);
router.post('/create-preference', createPayment);
router.post('/webhook', handleWebhook);
router.get('/order/:externalReference', getOrderStatus);

export default router;
