const { model, Sequelize } = require("../../models/index");
const productService = require("../productService");
const remitoService = require("../remito/remitoService");
const egressService = require("../balance/egresosService");
const balanceMensualService = require("../balance/balanceMensualService");

const devolucionService = {
    // Sincroniza la operación completa (Cabecera + Paquetes + Productos)
    async createOperation(data) {
        const transaction = await Sequelize.transaction();
        try {
            // 1. Registrar la devolución en el historial técnico
            const operation = await model.devolucion.create(data, {
                include: [{
                    model: model.devolucionLote,
                    as: 'returnPackages',
                    include: [{
                        model: model.devolucionProducto,
                        as: 'products'
                    }]
                }],
                transaction
            });

            // 2. Procesar impactos en inventario y remitos
            for (const pkg of data.returnPackages) {
                for (const prod of pkg.products) {
                    // Si tenemos un productId, descontamos del stock general
                    // Nota: prod.productId y prod.remitoItemId deben venir del frontend
                    if (prod.productId) {
                        await productService.updateQuantityProduct(prod.productId, {
                            quantityToDiscount: prod.quantity,
                            color: prod.color,
                            almacenamiento: prod.storage
                        });
                    }

                    // Si viene de un remito y el remito no está pagado, ajustamos la deuda
                    if (prod.remitoItemId) {
                        const remitoItem = await model.remitoItem.findByPk(prod.remitoItemId, {
                            include: [{ model: model.remito, as: 'remito' }]
                        });

                        // Si el remito aún no está pagado, restamos la cantidad del lote para que baje el total de la deuda
                        if (remitoItem && remitoItem.remito && remitoItem.remito.estado === 'no pagado') {
                            await remitoService.updateRemitoItemQuantity(prod.remitoItemId, prod.quantity);

                            // Recalcular el total del remito
                            const allItems = await model.remitoItem.findAll({
                                where: { remitoId: remitoItem.remitoId },
                                transaction
                            });
                            const newTotal = allItems.reduce((acc, curr) => acc + (Number(curr.costoCompra) * Number(curr.cantidad)), 0);
                            await remitoItem.remito.update({ total: newTotal }, { transaction });
                        }
                    }
                }
            }

            await transaction.commit();
            return operation;
        } catch (error) {
            await transaction.rollback();
            console.error('ERROR_LOG: FALLO EN SISTEMA DE LOGÍSTICA REVERSA', error);
            throw error;
        }
    },

    async getAllOperations() {
        try {
            return await model.devolucion.findAll({
                include: [{
                    model: model.devolucionLote,
                    as: 'returnPackages',
                    include: [{ model: model.devolucionProducto, as: 'products' }]
                }],
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    },

    async deleteOperation(id) {
        const transaction = await Sequelize.transaction();
        try {
            const entry = await model.devolucion.findByPk(id);
            if (!entry) throw new Error('OPERACIÓN_NO_ENCONTRADA');

            // 1. Buscar los lotes asociados
            const lotes = await model.devolucionLote.findAll({
                where: { devolucionId: id },
                transaction
            });

            // 2. Para cada lote, eliminar sus productos
            for (const lote of lotes) {
                await model.devolucionProducto.destroy({
                    where: { loteId: lote.LoteId },
                    transaction
                });
            }

            // 3. Eliminar los lotes
            await model.devolucionLote.destroy({
                where: { devolucionId: id },
                transaction
            });

            // 4. Eliminar la cabecera (Soft-delete si paranoid: true, pero limpia los hijos antes)
            await entry.destroy({ transaction });

            await transaction.commit();
            return { message: 'OPERACIÓN_ELIMINADA_CON_ÉXITO' };
        } catch (error) {
            await transaction.rollback();
            console.error('ERROR_LOG: FALLO AL ELIMINAR OPERACIÓN DE DEVOLUCIÓN', error);
            throw error;
        }
    },

    // --- NUEVO: SISTEMA DE DEVOLUCIONES DE CLIENTES (B2C) ---
    async processCustomerReturn(data) {
        const transaction = await Sequelize.transaction();
        try {
            const {
                clientName,
                products, // Array de { productId, quantity, color, almacenamiento, name, marca, categoria, historicalIndex, recaudacionId }
                totalRefund,
                paymentMethod,
                reason,
                shouldReturnStock = true // Nuevo parámetro para decidir si retornar stock
            } = data;

            // 1. Restaurar Stock (opcional)
            if (shouldReturnStock) {
                // Usamos la misma lógica que en deleteEntry del balance mensual
                for (const item of products) {
                    await balanceMensualService.restoreSingleItem(
                        item.productId || item.id,
                        item.quantity || item.cantidad,
                        item.color,
                        item.almacenamiento
                    );
                }
            }

            // 1.1 Marcar en Historial de Recaudación (si aplica)
            const historicalGroups = {};
            products.forEach(p => {
                if (p.recaudacionId && p.historicalIndex !== undefined) {
                    if (!historicalGroups[p.recaudacionId]) historicalGroups[p.recaudacionId] = [];
                    historicalGroups[p.recaudacionId].push(p.historicalIndex);
                }
            });

            for (const recId in historicalGroups) {
                const rec = await model.RecaudacionFinal.findByPk(recId, { transaction });
                if (rec && rec.productosVendidos) {
                    let productos = JSON.parse(JSON.stringify(rec.productosVendidos));
                    historicalGroups[recId].forEach(idx => {
                        if (productos[idx]) {
                            productos[idx].estado = 'DEVOLUCION';
                            productos[idx].fechaDevolucion = new Date();
                        }
                    });
                    rec.setDataValue('productosVendidos', productos);
                    rec.changed('productosVendidos', true);
                    await rec.save({ transaction });
                }
            }

            // 2. Registrar Egreso (Salida de dinero)
            const egressData = {
                monto: parseFloat(totalRefund),
                detalle: `DEVOLUCIÓN CLIENTE: ${clientName.toUpperCase()} - MOTIVO: ${reason.toUpperCase()}`,
                medio: paymentMethod,
                responsable: 'VENTAS_DEVOLUCION',
                fecha: new Date()
            };
            const newEgress = await model.egress.create(egressData, { transaction });

            // 3. Registrar en Balance Mensual (Para seccionPagos)
            const productosStr = products.map(p => p.name).join(', ').substring(0, 250);
            const balanceEntry = {
                producto: `DEVOLUCION: ${productosStr.toUpperCase()}`,
                monto: -parseFloat(totalRefund),
                cantidad: products.reduce((acc, p) => acc + parseInt(p.quantity), 0),
                metodo_pago: paymentMethod,
                cliente: clientName.toUpperCase(),
                categoria: 'DEVOLUCION',
                fecha: new Date().toISOString().split('T')[0],
                detalles_pago: {
                    reason: reason.toUpperCase(),
                    egressId: newEgress.EgressId
                }
            };
            await model.balanceMensual.create(balanceEntry, { transaction });

            await transaction.commit();
            return { status: 'SUCCESS', message: 'DEVOLUCION_PROCESADA_CORRECTAMENTE' };
        } catch (error) {
            await transaction.rollback();
            console.error('ERROR_LOG: FALLO EN PROCESO DE DEVOLUCIÓN DE CLIENTE', error);
            throw error;
        }
    }
};

module.exports = devolucionService;