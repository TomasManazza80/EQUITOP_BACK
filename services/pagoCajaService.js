// Importamos la referencia directa al constructor 'PagoProducto'
import models from "../models/index.js";
const { PagoProducto } = models;
import productService from "./productService.js";
import { Op } from "sequelize";
const pagoService = {

    /**
     * Registra un ingreso manual desde el balance para que figure en el cierre de caja.
     */
    async createManualIncome(monto, detalle, metodoPago) {
        return await PagoProducto.create({
            productos: [{
                nombre: `INGRESO MANUAL: ${detalle}`,
                marca: 'MANUAL',
                categoria: 'VARIOS',
                cantidad: 1,
                monto: parseFloat(monto)
            }],
            montoTotal: parseFloat(monto),
            medioPago: (metodoPago || 'efectivo').toLowerCase(),
            origenDeVenta: 'ManualBalance',
            fecha: new Date(),
        });
    },

    /**
     * Registra un egreso manual desde el balance para que figure en el cierre de caja.
     */
    async createManualEgress(monto, detalle, metodoPago) {
        // Accedemos al modelo de egresos a través de la instancia de modelos
        if (models.egress) {
            return await models.egress.create({
                monto: Math.abs(parseFloat(monto)),
                detalle: `EGRESO MANUAL: ${detalle}`,
                medio: (metodoPago || 'efectivo').toLowerCase(),
                fecha: new Date().toISOString().split('T')[0]
            });
        }
        console.warn("Modelo 'egress' no encontrado para registrar egreso manual.");
        return null;
    },

    /**
     * Crea un nuevo registro de pago en la base de datos.
     * @param {Object} data - Datos del pago a crear.
     * @returns {Promise<Object>} El objeto PagoProducto creado.
     */
    async createPago(data) {
        console.log("Creando un nuevo pago y actualizando stock...");
        try {
            // 1. Crear el registro del pago
            const pago = await PagoProducto.create(data);

            // 2. Iterar sobre los productos para descontar stock
            if (data.productos && Array.isArray(data.productos)) {
                for (const item of data.productos) {
                    // Validamos que sea un producto (tenga ID y no sea servicio)
                    // Asumimos que servicios tienen categoria o marca 'SERVICIO' o IDs especiales.
                    // En el front se manda marca: 'SERVICIO' para reparaciones.
                    if (item.marca !== 'SERVICIO' && item.categoria !== 'SERVICIO') {
                        try {
                            await productService.updateQuantityProduct(item.id, {
                                quantityToDiscount: item.cantidad,
                                color: item.color,
                                almacenamiento: item.almacenamiento
                            });
                        } catch (stockError) {
                            console.error(`[STOCK_ERROR] No se pudo descontar stock para el producto ${item.nombre} (ID: ${item.id}):`, stockError.message);
                            // Opcional: Podríamos hacer rollback o notificar, pero por ahora logueamos.
                        }
                    }
                }
            }

            return pago;
        } catch (error) {
            console.error('Error al crear el pago:', error);
            throw error;
        }
    },

    /**
     * Obtiene pagos registrados, con filtro de rango de fecha opcional.
     * @param {string} [startDate] - Fecha de inicio (ISO string, opcional).
     * @param {string} [endDate] - Fecha de fin (ISO string, opcional).
     * @returns {Promise<Array<Object>>} Lista de pagos.
     */
    async getAllPagos(startDate, endDate) {
        try {
            const where = {};
            if (startDate && endDate) {
                const inicio = new Date(`${startDate}T00:00:00`);
                const fin = new Date(`${endDate}T23:59:59.999`);
                where.createdAt = { [Op.between]: [inicio, fin] };
            }
            const pagos = await PagoProducto.findAll({
                where,
                order: [['createdAt', 'DESC']]
            });
            return pagos;
        } catch (error) {
            console.error('Error al obtener los pagos:', error);
            throw error;
        }
    },

    /**
     * Obtiene un pago específico por su ID.
     * @param {number} id - ID del pago.
     * @returns {Promise<Object|null>} El objeto PagoProducto o null si no se encuentra.
     */
    async getPagoById(id) {
        try {
            const pago = await PagoProducto.findByPk(id);
            if (!pago) {
                throw new Error('Pago no encontrado');
            }
            return pago;
        } catch (error) {
            console.error(`Error al obtener el pago con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Actualiza un pago por su ID.
     * @param {number} id - ID del pago a actualizar.
     * @param {Object} updates - Objeto con los campos a actualizar.
     * @returns {Promise<Object>} El objeto PagoProducto actualizado.
     */
    async updatePago(id, updates) {
        try {
            const pago = await PagoProducto.findByPk(id);
            if (!pago) {
                throw new Error('Pago no encontrado');
            }
            // Actualiza el registro con los nuevos datos
            await pago.update(updates);
            return pago;
        } catch (error) {
            console.error(`Error al actualizar el pago con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Elimina (o hace soft-delete) un pago por su ID.
     * @param {number} id - ID del pago a eliminar.
     */
    async deletePago(id) {
        try {
            const pago = await PagoProducto.findByPk(id);
            if (!pago) {
                throw new Error('Pago no encontrado');
            }
            // Usa destroy() que realiza soft-delete
            await pago.destroy();
        } catch (error) {
            console.error(`Error al eliminar el pago con ID ${id}:`, error);
            throw error;
        }
    },
};

export default pagoService;