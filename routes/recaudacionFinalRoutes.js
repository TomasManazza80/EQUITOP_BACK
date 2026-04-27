import { Router } from 'express';
import recaudacionFinalController from '../controller/recaudacionFinalController.js';

const router = Router();

// --- Recaudacion Final Routes ---

// POST /api/recaudacion
router.post('/', recaudacionFinalController.createRecaudacion);

// GET /api/recaudacion
router.get('/', recaudacionFinalController.getAllRecaudaciones);

// GET /api/recaudacion/:id
router.get('/:id', recaudacionFinalController.getRecaudacionById);

// PUT /api/recaudacion/:id (Edit)
router.put('/:id', recaudacionFinalController.updateRecaudacion);

// DELETE /api/recaudacion/:id (Delete/Soft Delete)
router.delete('/:id', recaudacionFinalController.deleteRecaudacion);

// NUEVO: Verificación de cierres automáticos pendientes
router.post('/check-pending', recaudacionFinalController.checkPendingClosures);

export default router;