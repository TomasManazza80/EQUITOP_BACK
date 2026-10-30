import { Dispatch, GlobalConfig, Client, Order } from '../models/index.js';
import { Op } from 'sequelize';
import productService from '../services/productService.js';



const ventasEcommerceController = {

    /**
     * Crea una nueva orden de ecommerce.
     * Se llama desde el Cart.jsx antes de redirigir al pago.
     */
    async createOrder(req, res) {
        console.log("[ECOMMERCE] Recibiendo solicitud de orden:", req.body.name);
        try {
            // Se extraen los datos del cuerpo de la solicitud.
            // El 'total' enviado por el cliente será ignorado y recalculado en el servidor por seguridad.
            const {
                items, // Se espera: [{ productId, quantity, color, almacenamiento }]
                shippingCost,
                cellphone,
                name,
                address,
                city,
                province,
                postalCode,
                shippingOption,
                metadata
            } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'La orden debe contener al menos un item.' });
            }

            const enrichedItems = [];
            let calculatedSubtotal = 0;
            let totalFeeCalculated = 0;

            // Obtener configuración global de fee por si acaso
            const mpFeeConfig = await GlobalConfig.findOne({ where: { key: 'mp_fee' } });
            const globalFeePercentage = mpFeeConfig ? parseFloat(mpFeeConfig.value) : 0;

            // Iteramos sobre cada item del carrito para enriquecerlo con datos de la DB.
            for (const item of items) {
                let searchId = item.productId || item.ProductId || item.id;
                
                if (!searchId) {
                    console.warn('Se encontró un item sin ID en la orden:', item);
                    continue; // Opcional: lanzar un error si todos los items deben tener ID.
                }

                if (typeof searchId === 'string' && searchId.includes('-')) {
                    searchId = searchId.split('-')[0];
                }

                // 1. Usamos el ID para obtener el producto completo desde la base de datos.
                // searchId ya fue extraído en la validación anterior.

                const dbProduct = await productService.getProductById(searchId);
                if (!dbProduct) {
                    return res.status(404).json({ message: `El producto con ID ${searchId} no fue encontrado.` });
                }

                // 2. Buscamos la variante específica (color, almacenamiento) para obtener el precio y costo correctos.
                const productVariants = Array.isArray(dbProduct.variantes) ? dbProduct.variantes : [];
                const variantIndex = productService.findVariantIndex(productVariants, item.color, item.almacenamiento || item.storage);

                if (variantIndex === -1) {
                    return res.status(404).json({ message: `La variante para '${dbProduct.nombre}' no fue encontrada.` });
                }
                const selectedVariant = productVariants[variantIndex];

                // 3. Extraemos los datos autoritativos (precio, costo) de la variante encontrada.
                const unitPrice = parseFloat(selectedVariant.precioAlPublico) || 0;
                const costPrice = parseFloat(selectedVariant.costoDeCompra) || 0;
                const quantity = parseInt(item.quantity) || 1;

                // 4. Construimos el objeto del item enriquecido que se guardará en el JSON de la orden.
                enrichedItems.push({
                    productId: dbProduct.id,
                    title: dbProduct.nombre,
                    quantity: quantity,
                    unit_price: unitPrice,
                    cost_price: costPrice, // Guardamos el costo para cálculos de ganancia futuros.
                    color: selectedVariant.color,
                    almacenamiento: selectedVariant.almacenamiento || selectedVariant.storage,
                    image: Array.isArray(dbProduct.imagenes) && dbProduct.imagenes.length > 0 ? dbProduct.imagenes[0] : null
                });

                // 5. Acumulamos el subtotal calculado en el servidor.
                calculatedSubtotal += unitPrice * quantity;

                // 6. Calculamos la comisión específica para este producto
                // Si dbProduct.tasaEcommerce es null, usa globalFeePercentage. Si es número (incluido 0), usa ese.
                const productFeeRate = (dbProduct.tasaEcommerce !== null && dbProduct.tasaEcommerce !== undefined) 
                                        ? parseFloat(dbProduct.tasaEcommerce) 
                                        : globalFeePercentage;
                
                totalFeeCalculated += (unitPrice * quantity) * (productFeeRate / 100);
            }

            // El total final es el subtotal de productos + el costo de envío + la comisión de MP.
            const shippingFee = (parseFloat(shippingCost) || 0) * (globalFeePercentage / 100);
            
            const finalTotal = calculatedSubtotal + (parseFloat(shippingCost) || 0) + totalFeeCalculated + shippingFee;

            // Generamos o asignamos el código de seguimiento único
            const trackingCode = req.body.tracking || `EQT-${Math.floor(100000 + Math.random() * 900000)}`;

            // 6. Creamos la orden en la base de datos con los datos enriquecidos y el total calculado.
            const newOrder = await Dispatch.create({
                name,
                cellphone,
                address,
                city,
                province,
                postalCode,
                shippingOption,
                shippingCost: shippingCost || 0,
                total: finalTotal,
                items: enrichedItems,
                dispatchStatus: 'PENDIENTE',
                tracking: trackingCode,
                metadata_ecommerce: metadata || {}
            });

            // 7. Almacenar información del comprador en el módulo de clientes
            try {
                if (cellphone) {
                    const existingClient = await Client.findOne({ where: { telefono: cellphone } });
                    if (!existingClient) {
                        const fullAddress = [address, city, province, postalCode].filter(Boolean).join(', ');
                        await Client.create({
                            nombre: name || 'CLIENTE_ECOMMERCE',
                            telefono: cellphone,
                            direccion: fullAddress || null
                        });
                        console.log(`[ECOMMERCE] Nuevo cliente registrado: ${cellphone}`);
                    } else {
                        console.log(`[ECOMMERCE] Cliente existente: ${cellphone}. No se duplica.`);
                    }
                }
            } catch (clientError) {
                console.error("[ECOMMERCE_CLIENT_SAVE_ERROR]", clientError);
                // No bloqueamos la respuesta de la orden si falla el registro del cliente
            }

            res.status(201).json({ message: "Orden creada", order: newOrder });

        } catch (error) {
            console.error("[ECOMMERCE_CREATE_ERROR]", error);
            res.status(500).json({ message: 'Error al crear la orden', error: error.message });
        }
    },

    /**
     * Obtiene las órdenes.
     * Soporta ?unshipped=true para filtrar las que no están finalizadas (para enviosProductos.jsx).
     */
    async getOrders(req, res) {
        try {
            const { unshipped } = req.query;
            const whereClause = {};

            if (unshipped === 'true') {
                // Filtra todo lo que NO esté RECIBIDO (es decir, PENDIENTE o EN_CAMINO)
                whereClause.dispatchStatus = {
                    [Op.ne]: 'RECIBIDO'
                };
            }

            const orders = await Dispatch.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json(orders);
        } catch (error) {
            console.error("[ECOMMERCE_GET_ERROR]", error);
            res.status(500).json({ message: 'Error al obtener órdenes' });
        }
    },

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const {
                dispatchStatus,
                metadata_ecommerce,
                name,
                cellphone,
                address,
                city,
                province,
                postalCode,
                tracking,
                items,
                total
            } = req.body;

            const order = await Dispatch.findByPk(id);
            if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

            const updates = {};
            if (dispatchStatus) updates.dispatchStatus = dispatchStatus;
            if (metadata_ecommerce) updates.metadata_ecommerce = metadata_ecommerce;
            if (name) updates.name = name;
            if (cellphone) updates.cellphone = cellphone;
            if (address) updates.address = address;
            if (city) updates.city = city;
            if (province) updates.province = province;
            if (postalCode) updates.postalCode = postalCode;
            if (tracking) updates.tracking = tracking;
            if (items) updates.items = items;
            if (total !== undefined) updates.total = total;

            await order.update(updates);

            res.status(200).json(order);
        } catch (error) {
            console.error("[ECOMMERCE_UPDATE_ERROR]", error);
            res.status(500).json({ message: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await Dispatch.destroy({ where: { id } });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Consulta pública del estado de un envío por código de seguimiento o ID de orden.
     */
    async getTrackingInfo(req, res) {
        try {
            const { code } = req.params;
            if (!code || !code.trim()) {
                return res.status(400).json({ message: 'Código de seguimiento requerido.' });
            }

            const cleanCode = code.trim().toUpperCase();

            // Buscar en tabla Dispatch
            const dispatches = await Dispatch.findAll({
                order: [['createdAt', 'DESC']]
            });

            let found = dispatches.find(d => 
                (d.tracking && d.tracking.toUpperCase() === cleanCode) ||
                String(d.id) === cleanCode ||
                `EQT-${d.id}`.toUpperCase() === cleanCode ||
                (d.metadata_ecommerce && d.metadata_ecommerce.order_identifier && d.metadata_ecommerce.order_identifier.toUpperCase() === cleanCode)
            );

            // Si no se encuentra en Dispatch, buscar en Order
            if (!found && Order) {
                const orders = await Order.findAll({
                    order: [['createdAt', 'DESC']]
                });
                const foundOrder = orders.find(o =>
                    String(o.id) === cleanCode ||
                    `EQT-${o.id}`.toUpperCase() === cleanCode ||
                    (o.identifier && o.identifier.toUpperCase() === cleanCode)
                );

                if (foundOrder) {
                    found = {
                        id: foundOrder.id,
                        name: foundOrder.name,
                        cellphone: foundOrder.cellphone,
                        address: foundOrder.address,
                        city: foundOrder.city,
                        province: foundOrder.province,
                        postalCode: foundOrder.postalCode,
                        shippingOption: foundOrder.shippingOption,
                        shippingCost: foundOrder.shippingCost,
                        total: foundOrder.total,
                        dispatchStatus: foundOrder.dispatchStatus || 'PENDIENTE',
                        tracking: `EQT-${foundOrder.id}`,
                        items: foundOrder.items,
                        createdAt: foundOrder.createdAt,
                        updatedAt: foundOrder.updatedAt
                    };
                }
            }

            if (!found) {
                return res.status(404).json({ message: 'No se encontró ningún paquete o envío con ese código de seguimiento.' });
            }

            let parsedItems = found.items;
            if (typeof parsedItems === 'string') {
                try {
                    parsedItems = JSON.parse(parsedItems);
                } catch (e) {
                    parsedItems = [];
                }
            }

            return res.status(200).json({
                tracking: found.tracking || `EQT-${found.id}`,
                id: found.id,
                name: found.name || 'Cliente',
                city: found.city || '',
                province: found.province || '',
                address: found.address || '',
                shippingOption: found.shippingOption || 'STANDARD',
                shippingCost: parseFloat(found.shippingCost || 0),
                total: parseFloat(found.total || 0),
                dispatchStatus: found.dispatchStatus || 'PENDIENTE',
                items: Array.isArray(parsedItems) ? parsedItems : [],
                createdAt: found.createdAt,
                updatedAt: found.updatedAt
            });
        } catch (error) {
            console.error('[TRACKING_SEARCH_ERROR]', error);
            return res.status(500).json({ message: 'Error interno al consultar el seguimiento', error: error.message });
        }
    }
};

export default ventasEcommerceController;