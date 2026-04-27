const { model } = require("../../models/index");

const remitoService = {
    async createRemito(data) {
        try {
            // Sequelize detecta el arreglo 'productos' y crea todo junto
            return await model.remito.create(data, {
                include: [{ model: model.remitoItem, as: 'productos' }]
            });
        } catch (error) {
            console.error('ERROR_DB:', error);
            throw error;
        }
    },

    async getHistorial() {
        try {
            return await model.remito.findAll({
                include: [{ model: model.remitoItem, as: 'productos' }],
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('ERROR_FETCH:', error);
            throw error;
        }
    },

    async liquidarPago(id, metodoPago) {
        const remito = await model.remito.findByPk(id);
        if (!remito) throw new Error('No encontrado');

        // 1. Actualizar el remito
        await remito.update({ estado: 'pagado', metodoPago });

        // 2. Crear entrada en el balance (como un egreso / monto negativo)
        // Usamos una estructura compatible con lo que espera el balance
        const balanceEntry = {
            producto: `PAGO A PROVEEDOR - REMITO #${remito.RemitoId}`,
            monto: -Math.abs(parseFloat(remito.total)), // Forzamos negativo
            metodo_pago: (metodoPago || 'transferencia').toLowerCase(),
            categoria: 'PROVEEDORES',
            marca: remito.proveedor,
            cliente: 'FEDECELL_ADMIN',
            cantidad: 1, // Campo requerido por el modelo
            fecha: new Date().toISOString().split('T')[0],
            origenDeVenta: 'LocalFisico'
        };

        if (model.balanceMensual) {
            await model.balanceMensual.create(balanceEntry);
        }

        // 3. Crear registro en Egresos (para que aparezca en la sección de gastos)
        const egressEntry = {
            monto: parseFloat(remito.total), // Monto positivo
            detalle: `PAGO PROVEEDOR - REMITO #${remito.RemitoId} - ${remito.proveedor}`,
            medio: (metodoPago || 'efectivo').toLowerCase() // Asegurar formato
        };

        if (model.egress) {
            await model.egress.create(egressEntry);
        }

        // 4. Cargar los productos del remito al inventario real
        try {
            const remitoConProductos = await model.remito.findByPk(id, {
                include: [{ model: model.remitoItem, as: 'productos' }]
            });

            if (remitoConProductos?.productos?.length > 0) {
                const productService = require('../productService');
                const hoy = new Date().toISOString().split('T')[0];

                const productosParaInventario = remitoConProductos.productos.map(item => {
                    // Las variantes se guardan como JSON en remitoItem
                    let variantes = item.variantes;
                    if (typeof variantes === 'string') {
                        try { variantes = JSON.parse(variantes); } catch (e) { variantes = []; }
                    }

                    return {
                        nombre: item.nombre,
                        marca: item.marca || '',
                        categoria: item.categoria || '',
                        descripcion: item.descripcion || '',
                        imagenes: item.imagenes || [],
                        proveedor: item.proveedorOrigen || remito.proveedor || '',
                        alerta: item.alertaStock || 5,
                        origenDeVenta: 'admin',
                        fechaActualizacionPrecio: hoy,
                        ultimaFechaCargoStock: hoy,
                        // Si hay variantes guardadas, usarlas; si no, crear una por defecto con los datos del item
                        variantes: (Array.isArray(variantes) && variantes.length > 0) ? variantes : [{
                            color: 'Unico',
                            almacenamiento: 'Unico',
                            stock: item.cantidad || 0,
                            costoDeCompra: parseFloat(item.costoCompra) || 0,
                            precioAlPublico: parseFloat(item.precioVenta) || 0,
                            precioMayorista: parseFloat(item.precioMayorista) || 0,
                            precioRevendedor: parseFloat(item.precioRevendedor) || 0
                        }]
                    };
                });

                await productService.createBulkProducts(productosParaInventario);
                console.log(`[REMITO_PAGO] ✅ ${productosParaInventario.length} producto(s) cargados al inventario desde Remito #${id}`);
            }
        } catch (inventarioError) {
            // El error se loguea pero NO bloquea el pago si falla la carga al inventario
            console.error('[REMITO_PAGO] ❌ Error al cargar productos al inventario:', inventarioError);
        }

        return remito;

    },

    async updateRemitoItemQuantity(itemId, quantityToSubtract) {
        const item = await model.remitoItem.findByPk(itemId);
        if (!item) throw new Error('Item de remito no encontrado');

        const newQuantity = Math.max(0, item.cantidad - quantityToSubtract);
        return await item.update({ cantidad: newQuantity });
    }
};

module.exports = remitoService;