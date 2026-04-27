import pagoService from '../services/pagoCajaService.js';

const pagoController = {

    /**
     * Maneja la creación de un nuevo pago.
     * POST /api/pagos
     */
    async createPago(req, res) {
        try {
            const payload = req.body;
            console.log("Creando pago con datos:", payload);

            const pago = await pagoService.createPago(payload);

            // 201 Created
            res.status(201).json({
                message: 'Pago registrado exitosamente',
                data: pago
            });
        } catch (error) {
            console.error("Error en la creación del pago:", error);
            res.status(400).json({
                message: 'Error al registrar el pago. Verifique los datos.',
                error: error.message || 'Error interno del servidor'
            });
        }
    },

    /**
     * Obtiene la lista de pagos, con filtro de rango de fecha opcional.
     * GET /api/pagos?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     */
    async getAllPagos(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const pagos = await pagoService.getAllPagos(startDate, endDate);
            // 200 OK
            res.status(200).json(pagos);
        } catch (error) {
            console.error("Error al obtener los pagos:", error);
            res.status(500).json({ message: 'Error al obtener los pagos', error: error.message });
        }
    },

    /**
     * Obtiene un pago por su ID.
     * GET /api/pagos/:id
     */
    async getPagoById(req, res) {
        try {
            const id = req.params.id;
            const pago = await pagoService.getPagoById(id);

            res.status(200).json(pago);

        } catch (error) {
            console.error("Error al obtener pago por ID:", error);
            if (error.message === 'Pago no encontrado') {
                res.status(404).json({ message: 'Pago no encontrado' });
            } else {
                res.status(500).json({ message: 'Error al obtener el pago', error: error.message });
            }
        }
    },

    /**
     * Actualiza un pago por su ID.
     * PUT /api/pagos/:id
     */
    async updatePago(req, res) {
        try {
            const id = req.params.id;
            const updatedPago = await pagoService.updatePago(id, req.body);

            // 200 OK
            res.status(200).json({
                message: 'Pago actualizado exitosamente',
                data: updatedPago
            });
        } catch (error) {
            console.error("Error al actualizar pago:", error);
            if (error.message === 'Pago no encontrado') {
                res.status(404).json({ message: 'Pago no encontrado' });
            } else {
                res.status(400).json({
                    message: 'Error al actualizar el pago. Verifique los datos.',
                    error: error.message
                });
            }
        }
    },

    /**
     * Elimina un pago por su ID.
     * DELETE /api/pagos/:id
     */
    async deletePago(req, res) {
        try {
            const id = req.params.id;
            await pagoService.deletePago(id);

            // 204 No Content para indicar eliminación exitosa
            res.status(204).send();
            console.log(`Pago con ID ${id} eliminado/marcado para borrado.`);
        } catch (error) {
            console.error("Error al eliminar pago:", error);
            if (error.message === 'Pago no encontrado') {
                res.status(404).json({ message: 'Pago no encontrado' });
            } else {
                res.status(500).json({ message: 'Error al eliminar el pago', error: error.message });
            }
        }
    },

};

export default pagoController;