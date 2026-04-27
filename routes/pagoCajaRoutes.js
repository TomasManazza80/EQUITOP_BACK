import express from 'express';
import pagoController from '../controller/pagoCajaController.js';

const router = express.Router();

// Rutas CRUD para el modelo Pago

// POST: Crear un nuevo pago
// Ejemplo: POST /api/pagos
router.post('/pagos', pagoController.createPago); 

// GET: Obtener todos los pagos
// Ejemplo: GET /api/pagos
router.get('/pagos', pagoController.getAllPagos);

// GET: Obtener un pago por ID
// Ejemplo: GET /api/pagos/123
router.get('/pagos/:id', pagoController.getPagoById);

// PUT: Actualizar un pago por ID
// Ejemplo: PUT /api/pagos/123
router.put('/pagos/:id', pagoController.updatePago);

// DELETE: Eliminar un pago por ID (usará soft-delete si está configurado)
// Ejemplo: DELETE /api/pagos/123
router.delete('/pagos/:id', pagoController.deletePago);

export default router;