import express from 'express';
const router = express.Router();
import * as whatsappController from '../../controller/QrController/QrController.js';

router.get('/status', whatsappController.getWhatsappStatus);
router.post('/restart', whatsappController.restartWhatsapp);
router.post('/send-message', whatsappController.sendWhatsappMessage);

export default router;
