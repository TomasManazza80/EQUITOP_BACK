import { model, Responsable } from "../../models/index.js";
import * as whatsappService from "../QrService/QrService.js";

const monthlyExpenseService = {
    async createSingleExpense(expense) {
        // Guardar responsable en catálogo si no existe
        if (expense.responsable) {
            await Responsable.findOrCreate({
                where: { nombre: expense.responsable.trim().toUpperCase() },
                defaults: { nombre: expense.responsable.trim().toUpperCase() }
            });
        }
        return await model.monthlyExpense.create(expense);
    },
    async getAllExpenses() {
        return await model.monthlyExpense.findAll({ order: [['vencimiento', 'ASC']] });
    },
    async payExpense(id, medio_pago) {
        const expense = await model.monthlyExpense.findByPk(id);
        if (!expense) throw new Error('Gasto no encontrado');
        const nuevoEstado = !expense.pagado;
        return await expense.update({
            pagado: nuevoEstado,
            medio_pago: nuevoEstado ? medio_pago : null,
            fecha_pago: nuevoEstado ? new Date() : null
        });
    },
    async updateExpense(id, updates) {
        const expense = await model.monthlyExpense.findByPk(id);
        if (!expense) throw new Error('Gasto no encontrado');

        // Actualizar catálogo si el responsable cambió o es nuevo
        if (updates.responsable) {
            await Responsable.findOrCreate({
                where: { nombre: updates.responsable.trim().toUpperCase() },
                defaults: { nombre: updates.responsable.trim().toUpperCase() }
            });
        }

        return await expense.update(updates);
    },
    async getResponsables() {
        return await Responsable.findAll({ order: [['nombre', 'ASC']] });
    },
    async deleteResponsable(id) {
        const resp = await Responsable.findByPk(id);
        if (!resp) throw new Error('Responsable no encontrado');
        return await resp.destroy();
    },
    async deleteExpense(id) {
        const expense = await model.monthlyExpense.findByPk(id);
        if (!expense) throw new Error('No encontrado');
        return await expense.destroy();
    },
    async notifyExpense(id, phoneNumber) {
        const expense = await model.monthlyExpense.findByPk(id);
        if (!expense) throw new Error('Gasto no encontrado');

        const message = `*EQUITOP - Recordatorio de Pago* 🔔\n\n` +
            `Hola! Te recordamos que tienes un pago pendiente:\n\n` +
            `📦 *Concepto:* ${expense.nombre}\n` +
            `💰 *Monto:* $${parseFloat(expense.monto).toLocaleString()}\n` +
            `📅 *Vencimiento:* ${expense.vencimiento}\n\n` +
            `¡No olvides regularizarlo! 💸✨`;

        return await whatsappService.sendMessage(phoneNumber, message);
    },
    async resetAllExpenses() {
        return await model.monthlyExpense.update(
            { pagado: false, fecha_pago: null },
            { where: {} }
        );
    }
};

export default monthlyExpenseService;
