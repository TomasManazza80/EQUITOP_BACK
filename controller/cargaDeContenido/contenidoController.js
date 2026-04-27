const cmsVisualService = require('../../services/cargaDeContenidoService/contenidoService');

const cmsVisualController = {
    async createEntry(req, res) {
        try {
            const payload = req.body;
            let result;

            if (Array.isArray(payload)) {
                result = await cmsVisualService.createBulkEntries(payload);
                return res.status(201).json({
                    message: `${result.length} recursos visuales registrados`,
                    data: result
                });
            } else {
                result = await cmsVisualService.createSingleEntry(payload);
                res.status(201).json(result);
            }
        } catch (error) {
            res.status(400).json({ message: 'Error al registrar contenido visual', error: error.message });
        }
    },

    async getAllEntries(req, res) {
        try {
            const entries = await cmsVisualService.getAllEntries();
            res.status(200).json(entries);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener contenido visual' });
        }
    },

    async updateEntry(req, res) {
        try {
            console.log('--- CMS_UPDATE_REQUEST_START ---');
            console.log('PARAMS_ID:', req.params.id);
            console.log('REQ_BODY:', JSON.stringify(req.body, null, 2));

            if (!req.body || !req.body.imageUrl) {
                console.warn('[CMS_CONTROLLER] Error: Falta imageUrl en el body');
                return res.status(400).json({
                    message: 'Falta imageUrl en la petición',
                    receivedBody: req.body
                });
            }

            const result = await cmsVisualService.updateEntry(req.params.id, req.body);
            console.log('--- CMS_UPDATE_REQUEST_SUCCESS ---');
            res.status(200).json(result);
        } catch (error) {
            console.error('--- CMS_UPDATE_REQUEST_FAILED ---');
            console.error('[CMS_CONTROLLER_ERROR]', error);
            res.status(500).json({
                message: 'Error al actualizar contenido visual',
                detail: error.message,
                stack: error.stack
            });
        }
    },

    async deleteEntry(req, res) {
        try {
            await cmsVisualService.deleteEntry(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar contenido visual' });
        }
    }
};

module.exports = cmsVisualController;