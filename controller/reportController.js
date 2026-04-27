import { RecaudacionFinal, ProductBought, PagoProducto } from '../models/index.js';
import { Op } from 'sequelize';

const reportController = {
    async getNetProfit(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const whereClause = {};
            const whereClauseOpen = {};
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                whereClause.createdAt = { [Op.between]: [start, end] };
                whereClauseOpen.createdAt = { [Op.between]: [start, end] };
            }

            // 1. Obtener Cierres Archivados
            const records = await RecaudacionFinal.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']]
            });

            // 2. Obtener Ventas Ecommerce Abiertas (Sin cerrar)
            const openEcommerce = await ProductBought.findAll({
                where: whereClauseOpen
            });

            // 3. Obtener Ventas Locales Abiertas
            const openLocal = await PagoProducto.findAll({
                where: whereClauseOpen
            });

            let totalIngresos = 0;
            let totalCostos = 0;
            const detalle = [];
            const productosVendidos = [];

            // A. Procesar Cierres Archivados
            records.forEach(record => {
                const ingresos = parseFloat(record.totalFinal) || 0;
                let costosCierre = 0;

                const items = record.productosVendidos || [];
                items.forEach(item => {
                    const precioC = parseFloat(item.precioCompra) || 0;
                    const cant = parseInt(item.cantidadComprada) || 1;
                    const monto = parseFloat(item.monto) || 0;
                    costosCierre += precioC * cant;

                    productosVendidos.push({
                        fecha: record.createdAt,
                        nombre: item.nombreProducto,
                        cantidad: cant,
                        precioVentaTotal: monto,
                        costoTotal: precioC * cant,
                        ganancia: monto - (precioC * cant),
                        origen: item.canal || 'ARCHIVADO'
                    });
                });

                totalIngresos += ingresos;
                totalCostos += costosCierre;

                detalle.push({
                    id: record.id,
                    fecha: record.createdAt,
                    ingresos,
                    costos: costosCierre,
                    gananciaNeta: ingresos - costosCierre,
                    estado: 'ARCHIVADO'
                });
            });

            // B. Procesar Ecommerce Abierto
            openEcommerce.forEach(v => {
                const precioV = parseFloat(v.precio) || 0;
                const cant = parseInt(v.cantidad) || 1;
                const precioC = parseFloat(v.precioCompra) || 0;
                // Importante: El monto neto real después de descuentos se calcularía si existiera descuentoGlobalAplicado, 
                // pero seguiremos la lógica de cierreCajaDiario.jsx
                const montoTotal = precioV * cant;

                totalIngresos += montoTotal;
                totalCostos += precioC * cant;

                productosVendidos.push({
                    fecha: v.createdAt || v.fechaCompra,
                    nombre: v.nombre,
                    cantidad: cant,
                    precioVentaTotal: montoTotal,
                    costoTotal: precioC * cant,
                    ganancia: montoTotal - (precioC * cant),
                    origen: 'ECOMMERCE (OPEN)'
                });
            });

            // C. Procesar Local Abierto
            openLocal.forEach(pago => {
                const montoLocal = parseFloat(pago.montoTotal) || 0;
                totalIngresos += montoLocal;

                let costoLocal = 0;
                const items = pago.productos || [];
                items.forEach(item => {
                    const pC = parseFloat(item.precioCompra) || 0;
                    const c = parseInt(item.cantidad) || 1;
                    const mV = parseFloat(item.monto) || 0; // monto unitario en PagoProducto
                    costoLocal += pC * c;

                    productosVendidos.push({
                        fecha: pago.createdAt,
                        nombre: item.nombre,
                        cantidad: c,
                        precioVentaTotal: mV * c,
                        costoTotal: pC * c,
                        ganancia: (mV * c) - (pC * c),
                        origen: (pago.origenDeVenta || 'LOCAL').toUpperCase() + ' (OPEN)'
                    });
                });
                totalCostos += costoLocal;
            });

            res.json({
                resumen: {
                    totalIngresos,
                    totalCostos,
                    gananciaNetaTotal: totalIngresos - totalCostos,
                    margen: totalIngresos > 0 ? ((totalIngresos - totalCostos) / totalIngresos) * 100 : 0
                },
                detalle,
                productos: productosVendidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            });

        } catch (error) {
            console.error("Error generando reporte de ganancias consolidado:", error);
            res.status(500).json({ message: "Error al generar el reporte", error: error.message });
        }
    }
};

export default reportController;
