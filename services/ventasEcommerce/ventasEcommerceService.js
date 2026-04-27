const { Dispatch } = require("../../models/index");

const dispatchService = {
    /**
     * NORMALIZACIÓN FEDECELL:
     * Convierte datos heterogéneos (Manual o Ecommerce) al formato del modelo.
     */
    normalizarEnvio(data) {
        const items = Array.isArray(data.items) ? data.items : [];

        // Si viene del ecommerce, construimos la descripción del hardware
        const contenidoDetectado = items.length > 0
            ? items.map(i => `${i.quantity}x ${i.title}`).join(', ')
            : (data.descripcion || "CONTENIDO_NO_ESPECIFICADO");

        // Mapeamos los datos para que coincidan con el modelo Dispatch (name, address, items, etc.)
        return {
            name: data.name || data.cliente || "CLIENTE_S_N",
            cellphone: data.cellphone || data.telefono || "",
            address: data.address || "",
            city: data.city || "",
            province: data.province || "",
            postalCode: data.postalCode || "",
            shippingOption: data.shippingOption || data.metodo || "STANDARD",
            shippingCost: parseFloat(data.shippingCost || 0),
            total: parseFloat(data.total || data.monto || 0),
            dispatchStatus: data.dispatchStatus || data.estado || "PENDIENTE",
            items: items, // IMPORTANTE: Guardamos el array de productos
            tracking: data.tracking || null,
            metadata_ecommerce: {
                order_identifier: data.identifier || data.metadata_ecommerce?.order_identifier || null,
                sync_date: new Date().toISOString(),
                is_auto_sync: !!(data.identifier || data.metadata_ecommerce?.order_identifier),
                ...data.metadata_ecommerce
            }
        };
    },

    async createSingleDispatch(data) {
        const cleanData = this.normalizarEnvio(data);
        return await Dispatch.create(cleanData);
    },

    async getAllDispatches() {
        return await Dispatch.findAll({
            order: [['createdAt', 'DESC']],
            where: { deletedAt: null }
        });
    },

    async updateStatus(id, nuevoEstado) {
        const item = await Dispatch.findByPk(id);
        if (!item) throw new Error('DESPACHO_NO_ENCONTRADO');
        item.estado = nuevoEstado;
        return await item.save();
    },

    async deleteDispatch(id, adminPassword) {
        const item = await Dispatch.findByPk(id);
        if (!item) throw new Error('DESPACHO_NO_ENCONTRADO');

        // Validación MASTER_PASS para registros sensibles o completados
        if (item.estado === 'RECIBIDO' || item.monto > 100000) {
            const MASTER_PASS = process.env.ADMIN_DELETE_PASSWORD || 'admin123';
            if (!adminPassword || adminPassword !== MASTER_PASS) {
                throw new Error('REQUERIDA_PASS_CRITICA');
            }
        }
        return await item.destroy();
    }
};

module.exports = dispatchService;