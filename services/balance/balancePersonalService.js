const { model, Responsable } = require("../../models/index");

const balancePersonalService = {
    async createSingleEntry(entry) {
        try {
            const newEntry = await model.balancePersonal.create(entry);
            
            // Si hay un responsable, lo guardamos en el catálogo si no existe
            if (entry.responsable && entry.responsable.trim() !== '') {
                await Responsable.findOrCreate({
                    where: { nombre: entry.responsable.trim().toUpperCase() }
                });
            }

            return newEntry;
        } catch (error) {
            console.error('ERROR_LOG: FALLO EN BALANCE PERSONAL', error);
            throw error;
        }
    },

    async createBulkEntries(entries) {
        try {
            const result = await model.balancePersonal.bulkCreate(entries, { validate: true });
            
            // Procesamos responsables para carga masiva
            const responsablesInEntries = [...new Set(entries
                .map(e => e.responsable)
                .filter(r => r && r.trim() !== '')
                .map(r => r.trim().toUpperCase())
            )];

            for (const nombre of responsablesInEntries) {
                await Responsable.findOrCreate({ where: { nombre } });
            }

            return result;
        } catch (error) {
            console.error('ERROR_LOG: FALLO EN CARGA MASIVA PERSONAL', error);
            throw error;
        }
    },

    async getAllEntries() {
        try {
            return await model.balancePersonal.findAll({
                order: [['fecha', 'DESC'], ['createdAt', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    },

    async updateEntry(id, updates) {
        try {
            const entry = await model.balancePersonal.findByPk(id);
            if (!entry) throw new Error('Registro no encontrado');
            await entry.update(updates);

            // Si se actualizó el responsable, guardarlo en el catálogo
            if (updates.responsable && updates.responsable.trim() !== '') {
                await Responsable.findOrCreate({
                    where: { nombre: updates.responsable.trim().toUpperCase() }
                });
            }

            return entry;
        } catch (error) {
            throw error;
        }
    },

    async deleteEntry(id) {
        try {
            const entry = await model.balancePersonal.findByPk(id);
            if (!entry) throw new Error('Registro no encontrado');
            await entry.destroy();
        } catch (error) {
            throw error;
        }
    },

    async getResponsables() {
        try {
            const responsables = await Responsable.findAll({
                attributes: ['nombre'],
                order: [['nombre', 'ASC']]
            });
            return responsables.map(r => r.nombre);
        } catch (error) {
            console.error('ERROR_LOG: FALLO AL OBTENER RESPONSABLES', error);
            throw error;
        }
    }
};

module.exports = balancePersonalService;