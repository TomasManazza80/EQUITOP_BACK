import express from 'express';
const router = express.Router();
import monthlyExpenseController from '../../controller/balance/gastosMensualesController.js';

router.post('/crearGastoMensual', monthlyExpenseController.createExpense);
router.get('/obtenerGastosMensuales', monthlyExpenseController.getAllExpenses);
router.get('/responsables', monthlyExpenseController.getResponsables);
router.delete('/responsables/:id', monthlyExpenseController.deleteResponsable);
router.put('/confirmarPago/:id', monthlyExpenseController.confirmPayment);
router.put('/actualizarGasto/:id', monthlyExpenseController.updateExpense);
router.post('/notificar/:id', monthlyExpenseController.notifyExpense);
router.delete('/eliminarGastoMensual/:id', monthlyExpenseController.deleteExpense);
router.put('/resetGastos', monthlyExpenseController.resetExpenses);

export default router;
