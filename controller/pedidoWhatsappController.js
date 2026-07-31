const { PedidoWhatsapp, product } = require("../models");
const Sequelize = require("sequelize");

const pedidoWhatsappController = {
    // Create new order
    crearPedido: async (req, res) => {
        try {
            const { clienteNombre, clienteWhatsapp, productos, total } = req.body;
            
            // Generate unique identifier e.g. WPP-1234
            const count = await PedidoWhatsapp.count();
            const identificador = `WPP-${String(count + 1).padStart(4, '0')}`;

            const nuevoPedido = await PedidoWhatsapp.create({
                identificador,
                clienteNombre,
                clienteWhatsapp,
                productos,
                total
            });

            return res.status(201).json({ message: "Pedido creado con éxito", pedido: nuevoPedido });
        } catch (error) {
            console.error("Error al crear pedido:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    },

    // Edit existing order
    editarPedido: async (req, res) => {
        try {
            const { id } = req.params;
            const { clienteNombre, clienteWhatsapp, productos, total } = req.body;

            const pedido = await PedidoWhatsapp.findByPk(id);
            if (!pedido) {
                return res.status(404).json({ error: "Pedido no encontrado" });
            }

            pedido.clienteNombre = clienteNombre;
            pedido.clienteWhatsapp = clienteWhatsapp;
            pedido.productos = productos;
            pedido.total = total;

            await pedido.save();

            return res.status(200).json({ message: "Pedido actualizado con éxito", pedido });
        } catch (error) {
            console.error("Error al actualizar pedido:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    },

    // Get all orders
    obtenerPedidos: async (req, res) => {
        try {
            const pedidos = await PedidoWhatsapp.findAll({
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json(pedidos);
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    },

    // Update status manually
    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const pedido = await PedidoWhatsapp.findByPk(id);
            if (!pedido) {
                return res.status(404).json({ error: "Pedido no encontrado" });
            }

            pedido.estado = estado;
            await pedido.save();

            return res.status(200).json({ message: "Estado actualizado", pedido });
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    },

    // Cobrar pedido - stock deduction
    cobrarPedido: async (req, res) => {
        try {
            const { id } = req.params;

            const pedido = await PedidoWhatsapp.findByPk(id);
            if (!pedido) {
                return res.status(404).json({ error: "Pedido no encontrado" });
            }

            if (pedido.estado === 'Cobrado y Entregado') {
                return res.status(400).json({ error: "El pedido ya fue cobrado" });
            }

            // Discount stock for system products
            const productos = pedido.productos || [];
            
            for (const prod of productos) {
                if (prod.tipo === 'sistema' && prod.id) {
                    const dbProduct = await product.findByPk(prod.id);
                    if (dbProduct) {
                        // Check if it has variants or is a simple product
                        // Assuming simple stock deduction based on typical logic
                        if (prod.variant) {
                            // If variant logic exists, parse and update JSON variants
                            let variantes = [];
                            if (typeof dbProduct.variantes === 'string') {
                                variantes = JSON.parse(dbProduct.variantes);
                            } else {
                                variantes = dbProduct.variantes || [];
                            }

                            const vIndex = variantes.findIndex(v => v.color === prod.variant.color && v.almacenamiento === prod.variant.almacenamiento);
                            if (vIndex !== -1) {
                                let vStock = parseInt(variantes[vIndex].stock) || 0;
                                vStock = Math.max(0, vStock - prod.cantidad);
                                variantes[vIndex].stock = vStock.toString();
                            }
                            dbProduct.variantes = variantes; // Sequelize JSON type
                            await dbProduct.save();
                        } else {
                            let stockActual = parseInt(dbProduct.cantidad) || 0;
                            dbProduct.cantidad = Math.max(0, stockActual - prod.cantidad);
                            await dbProduct.save();
                        }
                    }
                }
            }

            pedido.estado = 'Cobrado y Entregado';
            await pedido.save();

            return res.status(200).json({ message: "Pedido cobrado y stock descontado", pedido });
        } catch (error) {
            console.error("Error al cobrar pedido:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
};

module.exports = pedidoWhatsappController;
