import service from '../services/reparacionesService.js';
import * as whatsappService from '../services/QrService/QrService.js';

const reparacionesController = {
    async create(req, res) {
        try {
            const result = await service.create(req.body);
            res.status(201).json(result);
        } catch (error) {
            // Es una buena práctica registrar el error completo en el servidor para depuración
            console.error("Error al crear la reparación:", error);

            if (error.name === 'SequelizeUniqueConstraintError') {
                // Esto ocurre si un campo único (como numeroOrden) se duplica.
                // 409 Conflict es un código de estado más apropiado.
                const field = error.errors[0].path;
                return res.status(409).json({
                    error: `El valor para '${field}' ya existe. Por favor, usa uno diferente.`
                });
            }
            if (error.name === 'SequelizeValidationError') {
                // Esto ocurre si faltan campos requeridos (allowNull: false) o los datos no son válidos.
                const messages = error.errors.map(err => err.message);
                return res.status(400).json({ error: "Datos inválidos o faltantes", details: messages });
            }

            // Para cualquier otro tipo de error, es mejor un 500 Internal Server Error.
            res.status(500).json({ error: "Ocurrió un error en el servidor." });
        }
    },

    async getAll(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const data = await service.getAll(startDate, endDate);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const result = await service.update(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateStatus(req, res) {
        try {
            const { estado, ...additionalData } = req.body;
            const result = await service.updateStatus(req.params.id, estado, additionalData);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            await service.delete(req.params.id);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async notifyClient(req, res) {
        try {
            const item = await service.getById(req.params.id);
            if (!item) return res.status(404).json({ error: 'REPARACION_NO_ENCONTRADA' });

            if (!item.celular) {
                return res.status(400).json({ error: 'EL_CLIENTE_NO_TIENE_CELULAR_REGISTRADO' });
            }

            const nombre = item.nombreDueno || 'Cliente';
            const equipo = item.modeloEquipo || 'Equipo en reparación';
            const monto = item.montoAPagar ? `$${parseFloat(item.montoAPagar).toLocaleString()}` : 'Presupuesto pendiente';

            const message = `*EQUITOP - Servicio Técnico* 📱\n\n` +
                `Hola *${nombre}* 👋, te informamos que tu equipo ya está listo para ser retirado!\n\n` +
                `*Detalles de la reparación:*\n` +
                `🛠️ *Equipo:* ${equipo}\n` +
                `📑 *Orden:* #${item.numeroOrden}\n` +
                `💰 *Total a abonar:* ${monto}\n\n` +
                `¡Te esperamos en el local! 🤝✨`;

            await whatsappService.sendMessage(item.celular, message);
            res.json({ success: true, message: 'Notificación enviada' });
        } catch (error) {
            console.error("ERROR_NOTIFYING_WHATSAPP", error);
            res.status(500).json({ error: error.message === 'WHATSAPP_NOT_CONNECTED' ? 'WhatsApp no está conectado' : 'Error al enviar mensaje' });
        }
    }
};

export default reparacionesController;