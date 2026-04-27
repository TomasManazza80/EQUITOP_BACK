// Importación solicitada: extraemos 'model' del índice de modelos
const { model } = require("../../models/index");

const debtService = {
    // Obtener todos los controles de deudas
    async getAllDebts() {
        try {
            return await model.debtControl.findAll({
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            throw new Error("LOG_ERROR_GET_DEBTS: " + error.message);
        }
    },

    // Crear un nuevo registro de deuda
    async createDebt(data) {
        try {
            // Generar detalle de cuotas si aplica
            if (data.cuotasTotales > 1 && !data.detalleCuotas) {
                const montoCuota = parseFloat(data.montoTotal) / parseInt(data.cuotasTotales);
                data.detalleCuotas = Array.from({ length: data.cuotasTotales }, (_, i) => ({
                    numero: i + 1,
                    monto: montoCuota,
                    pagado: false,
                    fechaPago: null
                }));
            }
            return await model.debtControl.create(data);
        } catch (error) {
            throw new Error("LOG_ERROR_CREATE_DEBT: " + error.message);
        }
    },

    // Actualizar una deuda (para pagos parciales o amortización)
    async updateDebt(id, data) {
        try {
            const debt = await model.debtControl.findByPk(id);
            if (!debt) throw new Error('DEBT_NOT_FOUND');
            return await debt.update(data);
        } catch (error) {
            throw new Error("LOG_ERROR_UPDATE_DEBT: " + error.message);
        }
    },

    // Eliminar registro de deuda
    async deleteDebt(id) {
        try {
            const debt = await model.debtControl.findByPk(id);
            if (!debt) throw new Error('DEBT_NOT_FOUND');
            return await debt.destroy();
        } catch (error) {
            throw new Error("LOG_ERROR_DELETE_DEBT: " + error.message);
        }
    }
};

module.exports = debtService;