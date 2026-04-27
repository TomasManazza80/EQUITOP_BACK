import * as whatsappService from '../../services/QrService/QrService.js';

export const getWhatsappStatus = (req, res) => {
    const data = whatsappService.getStatus();
    res.status(200).json(data);
};

export const restartWhatsapp = async (req, res) => {
    try {
        await whatsappService.restart();
        res.status(200).json({ message: 'Reiniciando...' });
    } catch (error) {
        res.status(500).json({ error: 'Error al reiniciar' });
    }
};

export const sendWhatsappMessage = async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Se requieren los campos phone y message' });
    }

    try {
        const result = await whatsappService.sendMessage(phone, message);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'WHATSAPP_NOT_CONNECTED') {
            return res.status(503).json({
                error: 'WhatsApp no está conectado. Escanee el QR primero.',
                code: 'WHATSAPP_NOT_CONNECTED'
            });
        }
        console.error('[WhatsApp] Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error interno al enviar el mensaje' });
    }
};
