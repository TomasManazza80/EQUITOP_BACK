const balanceMensualService = require('../../services/balance/balanceMensualService');

const balanceMensualController = {
    async createEntry(req, res) {
        try {
            const payload = req.body;
            let result;

            if (Array.isArray(payload)) {
                result = await balanceMensualService.createBulkEntries(payload);
                return res.status(201).json({
                    message: `${result.length} registros de balance creados`,
                    data: result
                });
            } else {
                result = await balanceMensualService.createSingleEntry(payload);
                res.status(201).json(result);
            }
        } catch (error) {
            res.status(400).json({ message: 'Error en la operación de balance', error: error.message });
        }
    },

    async getAllEntries(req, res) {
        console.log("GET_ALL_ENTRIES_REQUEST_RECEIVED", {
            auth: req.headers.authorization ? "PRESENT" : "MISSING",
            userAgent: req.headers['user-agent']
        });
        try {
            const entries = await balanceMensualService.getAllEntries();
            console.log(`GET_ALL_ENTRIES_SUCCESS: ${entries.length} items found.`);
            res.status(200).json(entries);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener registros de balance' });
        }
    },

    async getEntryById(req, res) {
        try {
            const entry = await balanceMensualService.getEntryById(req.params.id);
            res.status(200).json(entry);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    },

    async updateEntry(req, res) {
        try {
            const entry = await balanceMensualService.updateEntry(req.params.id, req.body);
            res.status(200).json(entry);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar registro de balance' });
        }
    },

    async deleteEntry(req, res) {
        try {
            await balanceMensualService.deleteEntry(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar registro' });
        }
    },

    async deleteAllEntries(req, res) {
        try {
            await balanceMensualService.deleteAllEntries();
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al resetear conteo de billetes' });
        }
    }
};

module.exports = balanceMensualController;