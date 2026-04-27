import { Dispatch, GlobalConfig, Client } from '../models/index.js';
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
                const searchId = item.productId || item.ProductId || item.id;
                if (!searchId) {
                    console.warn('Se encontró un item sin ID en la orden:', item);
                    continue; // Opcional: lanzar un error si todos los items deben tener ID.
                }

                // 1. Usamos el ID para obtener el producto completo desde la base de datos.
                // searchId ya fue extraído en la validación anterior.

                if (!searchId) {
                    console.warn('Se encontró un item sin ID en la orden:', item);
                    continue;
                }

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
    }
};

export default ventasEcommerceController;