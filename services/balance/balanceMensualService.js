const { model } = require("../../models/index");

// Función auxiliar para restaurar un solo ítem de stock
const restoreSingleItem = async (productId, cantidad, color, almacenamiento) => {
    const numericId = parseInt(productId);
    if (isNaN(numericId)) {
        console.log(`[STOCK_RESTORE] SKIP: Invalid productId: ${productId}`);
        return;
    }

    console.log(`[STOCK_RESTORE] Processing: Product ${numericId}, Qty ${cantidad}, Color ${color}, Alm ${almacenamiento}`);

    const product = await model.product.findByPk(numericId);
    if (product && product.variantes) {
        let variants = JSON.parse(JSON.stringify(product.variantes)); // Deep copy
        let found = false;

        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];

            // Normalizamos para comparación case-insensitive y trim
            const entryColorNorm = (color || '').trim().toLowerCase();
            const vColorNorm = (v.color || '').trim().toLowerCase();
            const entryAlmNorm = String(almacenamiento || '').trim().toLowerCase();
            const vAlmNorm = String(v.almacenamiento || '').trim().toLowerCase();

            // Si el producto tiene variantes reales, color o almacenamiento deberían coincidir.
            // Si es "Unico", coincidirá por defecto si ambos son null/empty.
            const matchColor = !entryColorNorm || vColorNorm === entryColorNorm;
            const matchAlm = !entryAlmNorm || vAlmNorm === entryAlmNorm;

            if (matchColor && matchAlm) {
                const currentStock = parseInt(variants[i].stock) || 0;
                const restoreQty = parseInt(cantidad) || 0;
                variants[i].stock = currentStock + restoreQty;
                found = true;
                console.log(`[STOCK_RESTORE] MATCH_FOUND in variant ${i}. New stock: ${variants[i].stock}`);
                break;
            }
        }

        if (found) {
            // Usamos setDataValue para asegurar que Sequelize detecte el cambio en el JSON
            product.setDataValue('variantes', variants);
            product.changed('variantes', true);
            await product.save();
            console.log(`[STOCK_RESTORE] SUCCESS: Product ${numericId} updated.`);
        } else {
            console.warn(`[STOCK_RESTORE] FAIL: No variant matched for Product ${numericId} (Color: ${color}, Alm: ${almacenamiento})`);
        }
    } else {
        console.warn(`[STOCK_RESTORE] FAIL: Product ${numericId} not found or has no variants array.`);
    }
};

const balanceMensualService = {
    async createSingleEntry(entry) {
        require("fs").appendFileSync("creation_log.txt", "PAYLOAD: " + JSON.stringify(entry) + "\n");
        try {
            // LÓGICA DE PAGOS MIXTOS
            if (entry.metodo_pago === 'mixto' && entry.detalles_mixto) {
                const { m1, v1, m2, v2 } = entry.detalles_mixto;
                const totalMix = parseFloat(v1) + parseFloat(v2);

                if (totalMix <= 0) throw new Error("Total mixto inválido");

                const ratio1 = parseFloat(v1) / totalMix;
                const ratio2 = parseFloat(v2) / totalMix;

                const entry1 = {
                    ...entry,
                    metodo_pago: m1,
                    monto: (parseFloat(entry.monto) * ratio1).toFixed(2),
                    producto: `${entry.producto} (Parcial ${m1.toUpperCase()})`
                };

                const entry2 = {
                    ...entry,
                    metodo_pago: m2,
                    monto: (parseFloat(entry.monto) * ratio2).toFixed(2),
                    producto: `${entry.producto} (Parcial ${m2.toUpperCase()})`
                };

                const r1 = await model.balanceMensual.create(entry1);
                const r2 = await model.balanceMensual.create(entry2);
                return [r1, r2];
            }

            return await model.balanceMensual.create(entry);
        } catch (error) {
            console.error('Error al crear entrada de balance:', error);
            throw error;
        }
    },

    async createBulkEntries(entries) {
        try {
            return await model.balanceMensual.bulkCreate(entries, { validate: true });
        } catch (error) {
            console.error('Error en carga masiva de balance:', error);
            throw error;
        }
    },

    async getAllEntries() {
        try {
            return await model.balanceMensual.findAll();
        } catch (error) {
            throw error;
        }
    },

    async getEntryById(id) {
        try {
            const entry = await model.balanceMensual.findByPk(id);
            if (!entry) throw new Error('Entrada de balance no encontrada');
            return entry;
        } catch (error) {
            throw error;
        }
    },

    async updateEntry(id, updates) {
        try {
            const entry = await model.balanceMensual.findByPk(id);
            if (!entry) throw new Error('Entrada de balance no encontrada');
            await entry.update(updates);

            // SINCRONIZACIÓN CON PAGO_PRODUCTO (Cierre de Caja)
            if (updates.metodo_pago && entry.id_transaccion && entry.origenDeVenta === 'LocalFisico') {
                const PagoProducto = model.PagoProducto;
                if (PagoProducto) {
                    console.log(`[SYNC] Sincronizando pago id_transaccion: ${entry.id_transaccion} -> ${updates.metodo_pago}`);
                    await PagoProducto.update(
                        { medioPago: updates.metodo_pago },
                        { where: { id_transaccion: entry.id_transaccion } }
                    );
                }
            }

            return entry;
        } catch (error) {
            console.error('Error al actualizar registro de balance y sincronizar Caja:', error);
            throw error;
        }
    },

    async deleteEntry(id) {
        try {
            const entry = await model.balanceMensual.findByPk(id);
            if (!entry) throw new Error('Entrada de balance no encontrada');

            const idTransaccion = entry.id_transaccion;
            let shouldRestore = true;

            // Si tiene id_transaccion, verificamos si quedan otros registros de la misma transacción
            if (idTransaccion) {
                // Importamos Op si no está disponible (generalmente se importa al inicio del archivo)
                const { Op } = require("sequelize");
                const count = await model.balanceMensual.count({
                    where: {
                        id_transaccion: idTransaccion,
                        BalanceMensualId: { [Op.ne]: id } // Excluimos el actual
                    }
                });

                if (count > 0) {
                    console.log(`[STOCK_RESTORE] Postponed: Transaction ${idTransaccion} still has ${count} other records.`);
                    shouldRestore = false;
                }
            }

            if (shouldRestore) {
                // CASO 1: Metadatos de venta estándar en la raíz (id_producto)
                if (entry.id_producto && entry.categoria !== 'SERVICIO' && entry.cantidad > 0) {
                    await restoreSingleItem(entry.id_producto, entry.cantidad, entry.color, entry.almacenamiento);
                }

                // CASO 2: Metadatos de venta mixta en detalles_pago.stock_metadata
                if (entry.detalles_pago && entry.detalles_pago.stock_metadata && Array.isArray(entry.detalles_pago.stock_metadata)) {
                    for (const item of entry.detalles_pago.stock_metadata) {
                        await restoreSingleItem(item.id, item.cantidad, item.color, item.almacenamiento);
                    }
                }
            } else {
                console.log(`[STOCK_RESTORE] SKIP: Stock will be restored when the last record of transaction ${idTransaccion} is deleted.`);
            }

            await entry.destroy();
        } catch (error) {
            console.error('Error al eliminar entrada y restaurar stock:', error);
            throw error;
        }
    },

    async deleteAllEntries() {
        try {
            // Reemplazamos el borrado total por un reseteo de detalles de billetes
            const entries = await model.balanceMensual.findAll();

            const promises = entries.map(entry => {
                if (entry.detalles_pago) {
                    const newDetails = { ...entry.detalles_pago };
                    delete newDetails.billetes;
                    delete newDetails.vuelto;

                    // Si el pago era mixto, también limpiamos la parte de efectivo del desglose si existe
                    // Aunque por la estructura actual se maneja principalmente en 'billetes'/'vuelto'

                    return entry.update({ detalles_pago: newDetails });
                }
                return Promise.resolve();
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('Error al resetear billetes:', error);
            throw error;
        }
    }
};

// Exportamos la función auxiliar para que pueda ser reutilizada
balanceMensualService.restoreSingleItem = restoreSingleItem;

module.exports = balanceMensualService;
