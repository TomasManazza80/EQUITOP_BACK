const { cmsVisual } = require("../../models/index");

const cmsVisualService = {
    async createSingleEntry(entry) {
        try {
            return await cmsVisual.create(entry);
        } catch (error) {
            console.error('ERROR_LOG: FALLO EN CARGA CMS VISUAL', error);
            throw error;
        }
    },

    async createBulkEntries(entries) {
        try {
            return await cmsVisual.bulkCreate(entries, { validate: true });
        } catch (error) {
            console.error('ERROR_LOG: FALLO EN CARGA MASIVA CMS', error);
            throw error;
        }
    },

    async getAllEntries() {
        try {
            return await cmsVisual.findAll({
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    },

    async updateEntry(id, updates) {
        try {
            console.log(`[CMS_SERVICE] Sincronizando ID: ${id} | Payload:`, updates);
            const numericId = parseInt(id, 10);

            if (!updates.imageUrl) {
                console.error('[CMS_SERVICE_ERROR] Intento de sincronización sin imageUrl');
                throw new Error('SISTEMA_ERROR: URL_DE_IMAGEN_NULA_O_INVALIDA');
            }

            // Buscamos incluyendo registros eliminados (soft-deleted) para evitar conflictos de PK
            const entry = await cmsVisual.findByPk(numericId, { paranoid: false });

            if (!entry) {
                const createPayload = { ...updates, CmsVisualId: numericId };
                console.log(`[CMS_SERVICE] Creando nuevo registro ID ${numericId} con payload:`, JSON.stringify(createPayload, null, 2));
                return await cmsVisual.create(createPayload);
            }

            // Si el registro estaba eliminado, lo restauramos antes de actualizar
            if (entry.deletedAt) {
                console.log(`[CMS_SERVICE] Restaurando registro ID ${numericId}...`);
                await entry.restore();
            }

            console.log(`[CMS_SERVICE] Actualizando registro ID ${numericId} con payload:`, JSON.stringify(updates, null, 2));
            await entry.update(updates);
            return entry;
        } catch (error) {
            console.error('[CMS_SERVICE_ERROR] Error en updateEntry:', error);
            throw error;
        }
    },

    async deleteEntry(id) {
        try {
            const entry = await cmsVisual.findByPk(id);
            if (!entry) throw new Error('Recurso visual no encontrado');
            await entry.destroy();
        } catch (error) {
            throw error;
        }
    }
};

module.exports = cmsVisualService;