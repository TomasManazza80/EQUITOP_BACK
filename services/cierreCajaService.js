import dbModels from "../models/index.js";
const { PagoProducto, Dispatch, egresos: Egress, RecaudacionFinal, balanceMensual: BalanceMensual, GlobalConfig, Sequelize: sequelizeInstance } = dbModels;
import { Op } from "sequelize";

/**
 * Utility to format Date to YYYY-MM-DD in America/Argentina/Buenos_Aires
 */
const getLocalDateString = (dateObj) => {
    // We adjust to Argentina Time (UTC-3)
    const offset = -3;
    const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const arDate = new Date(utc + (3600000 * offset));
    return arDate.toISOString().split('T')[0];
};

const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(/-/g, '/');
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? new Date() : d;
};

const getLocalTimeString = (dateInput) => {
    try {
        const d = parseSafeDate(dateInput);
        if (isNaN(d.getTime())) return "00:00";
        
        // Argentina es UTC-3. Obtenemos la hora UTC y restamos 3.
        let h = d.getUTCHours() - 3;
        let m = d.getUTCMinutes();
        
        // Manejar el cambio de día si h < 0
        if (h < 0) h += 24;
        
        const hStr = h.toString().padStart(2, '0');
        const mStr = m.toString().padStart(2, '0');
        return `${hStr}:${mStr}`;
    } catch (e) {
        return "00:00";
    }
};

const cierreCajaService = {
    /**
     * Main entry point for automatic closure logic.
     * Can be called by Cron or manually via API.
     */
    async ejecutarCierreAutomatico(options = {}) {
        const { forceToday = false } = options;
        console.log(`[CIERRE_AUTO] Iniciando proceso. ForceToday: ${forceToday}`);

        try {
            // 1. Check Config
            const autoActivo = await GlobalConfig.findOne({ where: { key: 'equitop_auto_cierre_activado' } });
            if (autoActivo?.value !== 'true' && !forceToday) {
                console.log("[CIERRE_AUTO] Funcionalidad desactivada en configuración.");
                return { success: true, message: "Disabled" };
            }

            // 2. Fetch all pending data
            const [ventasEcom, egresos, todasLasEntradasBalance] = await Promise.all([
                Dispatch.findAll({ 
                    where: {
                        [Op.and]: [
                            sequelizeInstance.literal(`"Dispatch"."metadata_ecommerce"->>'cierreCaja' IS DISTINCT FROM 'true'`),
                            { dispatchStatus: { [Op.ne]: 'RECIBIDO' } }
                        ]
                    }
                }),
                Egress.findAll(),
                BalanceMensual.findAll({
                    where: sequelizeInstance.literal(`"balanceMensual"."detalles_pago"->>'cierreCaja' IS DISTINCT FROM 'true'`)
                })
            ]);

            // 3. Group by Date
            const movementsByDate = {};

            const addMovement = (date, type, data) => {
                const dStr = typeof date === 'string' ? date.split('T')[0] : getLocalDateString(date);
                if (!movementsByDate[dStr]) movementsByDate[dStr] = { ecom: [], local: [], egresos: [], manual: [] };
                movementsByDate[dStr][type].push(data);
            };

            ventasEcom.forEach(m => addMovement(m.createdAt, 'ecom', m));
            egresos.forEach(m => addMovement(m.fecha || m.createdAt, 'egresos', m));
            
            // Distribuimos entradas de BalanceMensual con la MISMA lógica que el frontend:
            // - con id_transaccion y monto > 0 → ventas locales (se agrupan igual que en cierreCajaDiario)
            // - sin id_transaccion y monto > 0 → ajustes manuales
            // - origen 'ecommerce' → espejos del ecommerce, se ignoran (ya están en Dispatch)
            // - monto <= 0 → egresos implícitos del balance, también se ignoran (usan tabla Egress)
            todasLasEntradasBalance.forEach(m => {
                const origen = (m.origenDeVenta || '').toLowerCase();
                const monto = parseFloat(m.monto) || 0;

                // Ignorar espejos de ecommerce
                if (origen === 'ecommerce') return;
                
                // Procesar tanto ingresos como ajustes negativos (egresos)
                if (monto === 0) return;

                if (m.id_transaccion) {
                    // Venta local agrupada por transacción (igual que el frontend)
                    addMovement(m.fecha || m.createdAt, 'local', m);
                } else {
                    // Ajuste manual sin ID de transacción (igual que el frontend)
                    addMovement(m.fecha || m.createdAt, 'manual', m);
                }
            });

            const datesFound = Object.keys(movementsByDate).sort();
            const todayStr = getLocalDateString(new Date());
            const processedDates = [];

            // 4. Iterate dates and close
            for (const dStr of datesFound) {
                // Lógica de coincidencia con Frontend:
                // Procesamos todas las fechas pendientes para limpiar acumulados, 
                // pero priorizamos el reporte si forceToday es true.
                if (dStr > todayStr) {
                    console.log(`[CIERRE_AUTO] Saltando fecha futura ${dStr}.`);
                    continue;
                }

                // Check for duplicate closure
                const checkDateFormato = dStr.split('-').reverse().join('/'); // Convert YYYY-MM-DD to DD/MM/YYYY
                const existing = await RecaudacionFinal.findOne({ 
                    where: { 
                        op2: { [Op.like]: `%${checkDateFormato}%` } 
                    } 
                });
                if (existing) {
                    console.log(`[CIERRE_AUTO] El cierre para ${dStr} ya existe. Saltando.`);
                    continue;
                }

                console.log(`[CIERRE_AUTO] Procesando fecha: ${dStr}`);
                await this.procesarCierreDeFecha(dStr, movementsByDate[dStr]);
                processedDates.push(dStr);
            }

            return { success: true, processedDates };

        } catch (error) {
            console.error("[CIERRE_AUTO_ERROR] Error en el servicio:", error);
            throw error;
        }
    },

    /**
     * Logic for closing a specific set of movements for a specific date string.
     */
    async procesarCierreDeFecha(dateStr, data) {
        const { ecom, local, egresos, manual } = data;

        let totalEcom = 0;
        let totalLocal = 0;
        let totalManualIncomes = 0;
        let totalManualExpenses = 0;
        const productosFormatted = [];
        const metodosPago = {
            efectivo: 0, debito: 0, transferencia: 0, mercadopago: 0,
            credito_1: 0, credito_2: 0, credito_3: 0, credito_4: 0, credito_5: 0, credito_6: 0, mixto: 0
        };

        // 1. Process E-commerce
        ecom.forEach(order => {
            const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]");
            items.forEach(item => {
                const monto = parseFloat(item.unit_price) * parseInt(item.quantity);
                totalEcom += monto;
                productosFormatted.push({
                    nombreProducto: item.title,
                    cantidadComprada: item.quantity,
                    monto: monto,
                    canal: 'ECOMMERCE',
                    medioPago: 'MercadoPago',
                    precioCompra: item.cost_price || 0,
                    fecha: dateStr,
                    hora: getLocalTimeString(order.createdAt)
                });
            });
            metodosPago.mercadopago += parseFloat(order.total || 0);
        });

        // 2. Process Local (Now from BalanceMensual items)
        local.forEach((item, idx) => {
            const monto = parseFloat(item.monto);
            totalLocal += monto;

            const medio = (item.metodo_pago || '').toLowerCase();
            if (metodosPago.hasOwnProperty(medio)) {
                metodosPago[medio] += monto;
            } else if (medio.includes('credito')) {
                const match = medio.match(/\d+/);
                const cuotas = match ? match[0] : '1';
                metodosPago[`credito_${cuotas}`] = (metodosPago[`credito_${cuotas}`] || 0) + monto;
            }

            productosFormatted.push({
                nombreProducto: item.producto,
                cantidadComprada: item.cantidad,
                monto: monto,
                canal: 'LOCAL',
                medioPago: item.metodo_pago,
                precioCompra: item.precioCompra || 0,
                fecha: dateStr,
                id_transaccion: item.id_transaccion,
                hora: getLocalTimeString(item.createdAt || item.fecha || new Date())
            });
        });

        // 3. Process Manual Adjustments (BalanceMensual)
        manual.forEach(m => {
            const monto = parseFloat(m.monto) || 0;
            const medio = (m.metodo_pago || 'efectivo').toLowerCase();
            
            if (monto > 0) {
                totalManualIncomes += monto;
                if (metodosPago.hasOwnProperty(medio)) metodosPago[medio] += monto;
            } else {
                totalManualExpenses += Math.abs(monto);
            }

            productosFormatted.push({
                nombreProducto: (m.producto || 'AJUSTE MANUAL').toUpperCase(),
                cantidadComprada: 1,
                monto: monto,
                canal: 'LOCAL',
                medioPago: m.metodo_pago,
                fecha: dateStr,
                esManual: true,
                hora: getLocalTimeString(m.createdAt || m.fecha || new Date())
            });
        });

        const totalVentasBrutas = totalEcom + totalLocal + totalManualIncomes;
        const totalEgresosRegular = egresos.reduce((acc, e) => acc + parseFloat(e.monto || 0), 0);
        const totalEgresosTotal = totalEgresosRegular + totalManualExpenses;

        // 4. Calcular Arqueo de Billetes (Agrupando por transacción para evitar duplicar billetes por producto)
        const billsTotal = { 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 };
        const changeTotal = { 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 };
        const transaccionesProcesadas = new Set();

        [...local, ...manual].forEach(item => {
            const tid = item.id_transaccion || `MANUAL_${item.BalanceMensualId}`;
            if (transaccionesProcesadas.has(tid)) return;
            transaccionesProcesadas.add(tid);

            let detalles = {};
            try { 
                detalles = typeof item.detalles_pago === 'string' ? JSON.parse(item.detalles_pago) : (item.detalles_pago || {}); 
            } catch(e) {}

            const medio = (item.metodo_pago || '').toLowerCase();
            if (medio === 'efectivo' && detalles.billetes) {
                Object.entries(detalles.billetes).forEach(([den, cant]) => {
                    if (billsTotal.hasOwnProperty(den)) billsTotal[den] += parseInt(cant) || 0;
                });
                if (detalles.vuelto) {
                    Object.entries(detalles.vuelto).forEach(([den, cant]) => {
                        if (changeTotal.hasOwnProperty(den)) changeTotal[den] += parseInt(cant) || 0;
                    });
                }
            }
        });

        // 5. Save RecaudacionFinal
        await RecaudacionFinal.create({
            mes: new Date(dateStr + 'T12:00:00').toLocaleString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase(),
            op2: `Fecha: ${dateStr.split('-').reverse().join('/')}`, // For display compatibility
            productosVendidos: productosFormatted,
            totalFinal: totalVentasBrutas - totalEgresosTotal,
            montoFinalEcommerce: totalEcom,
            montoFinalLocal: totalLocal + totalManualIncomes,
            detalles_billetes: billsTotal,
            detalles_vuelto: changeTotal,
            resumen_cierre: {
                Balance_Neto_Rango: totalVentasBrutas - totalEgresosTotal,
                Ventas_Registradas_Hoy: totalVentasBrutas,
                Extracciones_en_Rango: totalEgresosTotal,
                Operaciones_en_Rango: ecom.length + local.length + manual.length,
                metodosPago
            }
        });

        // 5. Cleanup
        // Mark ecommerce
        for (const order of ecom) {
            const meta = order.metadata_ecommerce || {};
            await order.update({
                metadata_ecommerce: { ...meta, cierreCaja: true, fechaCierre: new Date() }
            });
        }

        // Delete Local and Egress for that date
        // Note: Since we are grouping by date, we SHOULD delete only what belongs to that date.
        // But the tables PagoProducto/Egress don't usually store history.
        // To be safe and compliant with "Group by Date", we delete items we just processed.
        const localIds = local.map(l => l.pagoId || l.id_transaccion).filter(Boolean);
        const egressIds = egresos.map(e => e.EgressId).filter(Boolean);

        if (localIds.length > 0) await PagoProducto.destroy({ where: { pagoId: localIds } });
        if (egressIds.length > 0) await Egress.destroy({ where: { EgressId: egressIds } });

        // Marcar Entradas de BalanceMensual como Cerradas
        const allBalanceItems = [...local, ...manual];
        const updateBalancePromises = allBalanceItems.map(item => {
            let currentDetalles = {};
            try { 
                currentDetalles = typeof item.detalles_pago === 'string' ? JSON.parse(item.detalles_pago) : (item.detalles_pago || {}); 
            } catch(e) {}
            currentDetalles.cierreCaja = true;
            return item.update({ detalles_pago: currentDetalles });
        });
        await Promise.all(updateBalancePromises);

        // Optional reset of bills (BalanceMensual)
        const resetConfig = await GlobalConfig.findOne({ where: { key: 'equitop_reseteo_billetes_auto' } });
        if (resetConfig?.value === 'true') {
            const manualIds = manual.map(m => m.BalanceMensualId);
            if (manualIds.length > 0) await BalanceMensual.destroy({ where: { BalanceMensualId: manualIds } });
        }
    }
};

export default cierreCajaService;