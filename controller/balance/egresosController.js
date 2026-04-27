const egressService = require('../../services/balance/egresosService');

const egressController = {
    async createEgress(req, res) {
        try {
            const payload = req.body;
            let result;

            if (Array.isArray(payload)) {
                result = await egressService.createBulkEgresses(payload);
                return res.status(201).json({
                    message: `${result.length} egresos registrados`,
                    data: result
                });
            } else {
                result = await egressService.createSingleEgress(payload);
                res.status(201).json(result);
            }
        } catch (error) {
            res.status(400).json({ message: 'Error al registrar egreso', error: error.message });
        }
    },

    async getAllEgresses(req, res) {
        try {
            const data = await egressService.getAllEgresses();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener listado de egresos' });
        }
    },

    async updateEgress(req, res) {
        try {
            const { id } = req.params;
            const result = await egressService.updateEgress(id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar egreso', error: error.message });
        }
    },

    async deleteEgress(req, res) {
        try {
            await egressService.deleteEgress(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar egreso' });
        }
    },

    async getResponsables(req, res) {
        try {
            const data = await egressService.getResponsablesCatalog();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener responsables' });
        }
    }
};

module.exports = egressController;