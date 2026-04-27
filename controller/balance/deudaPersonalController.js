const debtService = require('../../services/balance/deudaPersonalService');

const debtController = {
    async getAll(req, res) {
        try {
            const result = await debtService.getAllDebts();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ status: 'ERROR', error: error.message });
        }
    },

    async create(req, res) {
        try {
            const result = await debtService.createDebt(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ status: 'ERROR', error: error.message });
        }
    },

    async update(req, res) {
        try {
            const result = await debtService.updateDebt(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ status: 'ERROR', error: error.message });
        }
    },

    async delete(req, res) {
        try {
            await debtService.deleteDebt(req.params.id);
            res.status(200).json({ status: 'SUCCESS', message: 'DEBT_DELETED' });
        } catch (error) {
            res.status(500).json({ status: 'ERROR', error: error.message });
        }
    }
};

module.exports = debtController;