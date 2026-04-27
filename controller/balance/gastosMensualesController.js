import monthlyExpenseService from '../../services/balance/gastosMensualesService.js';

const monthlyExpenseController = {
    async createExpense(req, res) {
        try {
            const result = await monthlyExpenseService.createSingleExpense(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ message: 'ERROR_REGISTRO', error: error.message });
        }
    },
    async getAllExpenses(req, res) {
        try {
            const data = await monthlyExpenseService.getAllExpenses();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'ERROR_LISTADO' });
        }
    },
    async getResponsables(req, res) {
        try {
            const data = await monthlyExpenseService.getResponsables();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'ERROR_LISTADO_RESPONSABLES' });
        }
    },
    async deleteResponsable(req, res) {
        try {
            await monthlyExpenseService.deleteResponsable(req.params.id);
            res.status(200).json({ message: 'RESPONSABLE_BORRADO' });
        } catch (error) {
            res.status(500).json({ message: 'ERROR_BORRADO_RESPONSABLE', error: error.message });
        }
    },
    async confirmPayment(req, res) {
        try {
            const result = await monthlyExpenseService.payExpense(req.params.id, req.body.medio_pago);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'ERROR_PAGO', error: error.message });
        }
    },
    async updateExpense(req, res) {
        try {
            const result = await monthlyExpenseService.updateExpense(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'ERROR_ACTUALIZACION', error: error.message });
        }
    },
    async deleteExpense(req, res) {
        try {
            await monthlyExpenseService.deleteExpense(req.params.id);
            res.status(200).json({ message: 'BORRADO_OK' });
        } catch (error) {
            res.status(500).json({ message: 'ERROR_BORRADO' });
        }
    },
    async notifyExpense(req, res) {
        try {
            const { phoneNumber } = req.body;
            if (!phoneNumber) return res.status(400).json({ message: 'FALTA_NUMERO' });
            const result = await monthlyExpenseService.notifyExpense(req.params.id, phoneNumber);
            res.status(200).json(result);
        } catch (error) {
            console.error("ERROR_NOTIFYING_WHATSAPP", error);
            res.status(500).json({ error: error.message === 'WHATSAPP_NOT_CONNECTED' ? 'WhatsApp no está conectado' : 'Error al enviar mensaje' });
        }
    },
    async resetExpenses(req, res) {
        try {
            await monthlyExpenseService.resetAllExpenses();
            res.status(200).json({ message: 'GASTOS_RESETEADOS' });
        } catch (error) {
            res.status(500).json({ message: 'ERROR_RESET', error: error.message });
        }
    }
};

export default monthlyExpenseController;
