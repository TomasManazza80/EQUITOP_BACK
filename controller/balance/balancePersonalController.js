const balancePersonalService = require('../../services/balance/balancePersonalService');

const balancePersonalController = {
    async createEntry(req, res) {
        try {
            const payload = req.body;
            let result;

            if (Array.isArray(payload)) {
                result = await balancePersonalService.createBulkEntries(payload);
                return res.status(201).json({
                    message: `${result.length} movimientos registrados exitosamente`,
                    data: result
                });
            } else {
                result = await balancePersonalService.createSingleEntry(payload);
                res.status(201).json(result);
            }
        } catch (error) {
            res.status(400).json({ message: 'Error al registrar movimiento personal', error: error.message });
        }
    },

    async getAllEntries(req, res) {
        try {
            const entries = await balancePersonalService.getAllEntries();
            res.status(200).json(entries);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener historial personal' });
        }
    },

    async updateEntry(req, res) {
        try {
            const result = await balancePersonalService.updateEntry(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar registro' });
        }
    },

    async deleteEntry(req, res) {
        try {
            await balancePersonalService.deleteEntry(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar registro' });
        }
    },

    async getResponsables(req, res) {
        try {
            const responsables = await balancePersonalService.getResponsables();
            res.status(200).json(responsables);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener lista de responsables' });
        }
    }
};

module.exports = balancePersonalController;