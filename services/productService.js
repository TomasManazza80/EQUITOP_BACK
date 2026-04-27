const { product } = require("../models/index");
const { Op } = require("sequelize");

// Función auxiliar para migrar datos planos a estructura de variantes si es necesario
const normalizarProducto = (data) => {
    let variantes = data.variantes;

    // Si no hay variantes, creamos una por defecto con los datos planos
    if (!variantes || !Array.isArray(variantes) || variantes.length === 0) {
        variantes = [{
            color: data.color || 'Unico',
            almacenamiento: data.almacenamiento || 'Unico',
            stock: Number(data.cantidad) || 0,
            precioAlPublico: Number(data.precioAlPublico) || Number(data.precioVenta) || 0,
            costoDeCompra: Number(data.precioCompra) || 0,
            precioMayorista: Number(data.precioMayorista) || 0,
            precioRevendedor: Number(data.precioRevendedor) || 0
        }];
    } else {
        // Sanitización: Aseguramos que los valores numéricos sean realmente números
        variantes = variantes.map(v => ({
            ...v,
            stock: Number(v.stock) || 0,
            precioAlPublico: Number(v.precioAlPublico) || 0,
            costoDeCompra: Number(v.costoDeCompra) || 0,
            precioMayorista: Number(v.precioMayorista) || 0,
            precioRevendedor: Number(v.precioRevendedor) || 0
        }));
    }

    // Actualizamos las variantes en el objeto data
    data.variantes = variantes;

    // Eliminamos propiedades planas para evitar errores en Sequelize (ya que se borraron del modelo)
    delete data.cantidad;
    delete data.precioVenta;
    delete data.precioCompra;
    delete data.precioMayorista;
    delete data.precioRevendedor;
    return data;
};

const productService = {

    async createSingleProduct(producto) {
        try {
            producto = normalizarProducto(producto);
            return await product.create(producto);
        } catch (error) {
            console.error('Error al crear producto:', error);
            throw error;
        }
    },

    async createBulkProducts(productos) {
        try {
            const productosProcesados = productos.map(p => normalizarProducto(p));
            return await product.bulkCreate(productosProcesados, { validate: true });
        } catch (error) {
            console.error('Error en carga masiva:', error);
            throw error;
        }
    },

    async getAllProducts(limit, page, search) {
        const options = {};

        if (search) {
            const words = search.split(/\s+/).filter(w => w.length > 0);
            if (words.length > 0) {
                options.where = {
                    [Op.and]: words.map(word => ({
                        [Op.or]: [
                            { nombre: { [Op.iLike]: `%${word}%` } },
                            { marca: { [Op.iLike]: `%${word}%` } },
                            { categoria: { [Op.iLike]: `%${word}%` } }
                        ]
                    }))
                };
            }
        }

        if (page) {
            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 20;
            options.limit = limitNumber;
            options.offset = (pageNumber - 1) * limitNumber;

            const { count, rows } = await product.findAndCountAll(options);
            
            return {
                products: rows,
                totalProducts: count,
                totalPages: Math.ceil(count / limitNumber),
                currentPage: pageNumber
            };
        }

        if (limit) options.limit = parseInt(limit);
        return await product.findAll(options);
    },

    async getProductById(id) {
        const item = await product.findByPk(id);
        if (!item) throw new Error('Producto no encontrado');
        return item;
    },

    async updateProduct(id, updates) {
        const item = await product.findByPk(id);
        if (!item) throw new Error('Producto no encontrado');

        // Si se actualizan variantes, asumimos actualización de precio
        if (updates.variantes) {
            updates.fechaActualizacionPrecio = new Date();
        }

        return await item.update(updates);
    },

    async updateQuantityProduct(productId, { quantityToDiscount, quantity, color, almacenamiento }) {
        const item = await product.findByPk(productId);
        if (!item) throw new Error('Producto no encontrado');

        // Obtener variantes y asegurar que sea un array válido
        let variantes = item.variantes;
        if (typeof variantes === 'string') {
            try { variantes = JSON.parse(variantes); } catch (e) { variantes = []; }
        }
        if (!variantes || !Array.isArray(variantes)) variantes = [];

        // Copia profunda para manipulación segura
        const variantesActualizadas = JSON.parse(JSON.stringify(variantes));

        if (variantesActualizadas.length === 0) throw new Error('El producto no tiene variantes configuradas.');

        // Normalización para búsqueda
        // Usamos la lógica interna de búsqueda
        const variantIndex = this.findVariantIndex(variantesActualizadas, color, almacenamiento);

        if (variantIndex === -1) throw new Error(`Variante no encontrada (Color: ${color}, Almacenamiento: ${almacenamiento})`);

        // Aceptamos quantityToDiscount o quantity
        const cantidadARestar = Math.abs(Number(quantityToDiscount || quantity));
        const currentStock = Number(variantesActualizadas[variantIndex].stock || 0);

        if (currentStock < cantidadARestar) {
            throw new Error(`Stock insuficiente. Disponible: ${currentStock}, Requerido: ${cantidadARestar}`);
        }

        const newStock = currentStock - cantidadARestar;
        variantesActualizadas[variantIndex].stock = newStock;

        // Verify if stock is now at or below the minimum, but previously it was above
        const limiteAlerta = Number(item.alerta) || 0;
        if (newStock <= limiteAlerta && currentStock > limiteAlerta) {
            try {
                console.log(`[STOCK_ALERT] Producto ID ${productId} bajó al stock de alerta (${newStock} <= ${limiteAlerta}). Intentando enviar WhatsApp...`);
                // Importación dinámica ya que QrService es ESM y productService es CommonJS
                const qrService = await import('./QrService/QrService.js');

                const adminPhone = process.env.ADMIN_PHONE;
                if (adminPhone) {
                    const variantText = (color || almacenamiento) ? `${color ? color : ''} ${almacenamiento ? almacenamiento : ''}`.trim() : 'Única';
                    const mensaje = `⚠️ *ALERTA DE STOCK MINIMO* ⚠️\n\n` +
                        `*Producto:* ${item.nombre}\n` +
                        `*Marca:* ${item.marca || 'N/A'}\n` +
                        `*Variante:* ${variantText}\n\n` +
                        `📉 *Stock Actual:* ${newStock}\n` +
                        `🔔 *Límite Configurado:* ${limiteAlerta}\n\n` +
                        `_Mensaje automático del sistema FEDE CELL_`;

                    await qrService.sendMessage(adminPhone, mensaje);
                    console.log(`[STOCK_ALERT] WhatsApp enviado correctamente al administrador.`);
                } else {
                    console.log(`[STOCK_ALERT] No se envió WhatsApp porque ADMIN_PHONE no está configurado en .env`);
                }
            } catch (qrErr) {
                console.error(`[STOCK_ALERT] Error enviando mensaje de WhatsApp:`, qrErr.message);
            }
        }

        console.log(`[STOCK_UPDATE] ID: ${productId} | Variante: ${variantIndex} | Nuevo Stock: ${variantesActualizadas[variantIndex].stock}`);

        // Guardado explícito para asegurar persistencia en columna JSON
        item.setDataValue('variantes', variantesActualizadas);
        item.changed('variantes', true);
        return await item.save();
    },

    // Helper para encontrar el índice de una variante en un array
    findVariantIndex(variantes, color, almacenamiento) {
        const searchColor = color ? String(color).trim().toLowerCase() : null;
        const searchStorage = almacenamiento ? String(almacenamiento).trim().toLowerCase() : null;

        if (searchColor || searchStorage) {
            return variantes.findIndex(v => {
                const vColor = v.color ? String(v.color).trim().toLowerCase() : null;
                const vStorage = v.almacenamiento ? String(v.almacenamiento).trim().toLowerCase() : null;

                // Coincidencia: Si el criterio de búsqueda existe, debe coincidir.
                // Si el criterio es null, asumimos coincidencia (o que la variante no tiene ese atributo)
                const matchColor = searchColor ? (vColor === searchColor) : true;
                const matchStorage = searchStorage ? (vStorage === searchStorage) : true;

                return matchColor && matchStorage;
            });
        } else if (variantes.length === 1) {
            // Si no se especifican criterios y solo hay una variante, devolvemos esa
            return 0;
        }
        return -1;
    },

    async deleteProduct(id, adminPassword) {
        const item = await product.findByPk(id);
        if (!item) throw new Error('Producto no encontrado');

        // NOTA: Se ha eliminado la validación por contraseña para borrar productos con stock,
        // según lo solicitado. Ahora la eliminación es directa tras la confirmación.

        return await item.destroy();
    },
};

module.exports = productService;