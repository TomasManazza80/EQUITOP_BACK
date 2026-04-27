const remitoService = require('../../services/remito/remitoService');

const remitoController = {
    async createEntry(req, res) {
        try {
            const result = await remitoService.createRemito(req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error("DETALLE_ERROR_BACK:", error);
            res.status(400).json({ message: 'Error en creación', error: error.message });
        }
    },

    async getAllEntries(req, res) {
        try {
            const history = await remitoService.getHistorial();
            res.status(200).json(history);
        } catch (error) {
            console.error("DETALLE_ERROR_BACK:", error);
            res.status(500).json({ message: 'Error al obtener historial' });
        }
    },

    async updatePayment(req, res) {
        try {
            const result = await remitoService.liquidarPago(req.params.id, req.body.metodoPago);
            res.status(200).json(result);
        } catch (error) {
            console.error("ERROR_LIQUIDAR_PAGO:", error);
            res.status(500).json({ message: 'Error en pago', detail: error.message });
        }
    }
};

module.exports = remitoController;