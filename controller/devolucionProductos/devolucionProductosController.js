const devolucionService = require('../../services/devolucionProductos/devolucionProductosService');

const devolucionController = {
    async createEntry(req, res) {
        try {
            const payload = req.body;
            // Validamos que el payload contenga la estructura esperada por el UI
            const result = await devolucionService.createOperation(payload);

            res.status(201).json({
                status: "SUCCESS",
                message: "OPERACIÓN_REGISTRADA_EN_CORE",
                data: result
            });
        } catch (error) {
            res.status(400).json({
                status: "ERROR",
                message: 'Error al procesar logística reversa',
                error: error.message
            });
        }
    },

    async getAllEntries(req, res) {
        try {
            const result = await devolucionService.getAllOperations();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error al recuperar historial de devoluciones' });
        }
    },

    async deleteEntry(req, res) {
        try {
            await devolucionService.deleteOperation(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar registro técnico' });
        }
    },

    async createCustomerReturn(req, res) {
        try {
            const payload = req.body;
            const result = await devolucionService.processCustomerReturn(payload);

            res.status(201).json({
                status: "SUCCESS",
                message: "DEVOLUCION_CLIENTE_REGISTRADA",
                data: result
            });
        } catch (error) {
            res.status(400).json({
                status: "ERROR",
                message: 'Error al procesar devolución de cliente',
                error: error.message
            });
        }
    }
};

module.exports = devolucionController;