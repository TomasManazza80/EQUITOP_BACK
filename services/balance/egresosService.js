const { model, Responsable } = require("../../models/index");

const egressService = {

    // Método para la creación de un solo egreso
    async createSingleEgress(egreso) {
        console.log("Registrando egreso para:", egreso.responsable, "| Detalle:", egreso.detalle);
        try {
            // 1. Intentamos guardar el responsable en el catálogo si tiene nombre
            if (egreso.responsable) {
                try {
                    await Responsable.findOrCreate({
                        where: { nombre: egreso.responsable.trim().toUpperCase() },
                        defaults: { nombre: egreso.responsable.trim().toUpperCase() }
                    });
                } catch (catError) {
                    console.warn("Advertencia: No se pudo actualizar catálogo de responsables", catError.message);
                }
            }

            // El ORM mapea las propiedades del objeto 'egreso' a la tabla 'egress'
            const newEgress = await model.egress.create(egreso);
            return newEgress;
        } catch (error) {
            console.error('Error al crear un solo egreso:', error);
            throw error;
        }
    },

    // Método para la Carga Masiva (Bulk Insert)
    async createBulkEgresses(egresos) {
        console.log(`Iniciando bulkCreate para ${egresos.length} egresos...`);
        try {
            // Se utiliza bulkCreate para una sola consulta optimizada
            const createdEgresses = await model.egress.bulkCreate(egresos, {
                validate: true
            });

            return createdEgresses;
        } catch (error) {
            console.error('Error durante la carga masiva de egresos:', error);
            throw error;
        }
    },

    // Obtener todos los registros activos (No borrados lógicamente)
    async getAllEgresses() {
        try {
            console.log("Recuperando listado de egresos de la DB...");
            const egresses = await model.egress.findAll({
                order: [['createdAt', 'DESC']] // Ordenamos por fecha de creación
            });
            return egresses;
        } catch (error) {
            console.error('Error al obtener egresos:', error);
            throw error;
        }
    },

    // Eliminación de registro (Borrado lógico por configuración del modelo)
    async deleteEgress(id) {
        console.log("Eliminando registro de egreso ID:", id);
        try {
            const egreso = await model.egress.findByPk(id);
            if (!egreso) {
                throw new Error('Egreso no encontrado');
            }
            await egreso.destroy(); // Ejecuta borrado lógico (paranoid)
            return { message: "Registro eliminado correctamente" };
        } catch (error) {
            console.error('Error al eliminar egreso:', error);
            throw error;
        }
    },

    // Actualizar un egreso existente
    async updateEgress(id, updates) {
        try {
            const egreso = await model.egress.findByPk(id);
            if (!egreso) throw new Error('Egreso no encontrado');

            if (updates.responsable) {
                await Responsable.findOrCreate({
                    where: { nombre: updates.responsable.trim().toUpperCase() },
                    defaults: { nombre: updates.responsable.trim().toUpperCase() }
                });
            }
            return await egreso.update(updates);
        } catch (error) {
            console.error('Error al actualizar egreso:', error);
            throw error;
        }
    },

    // Obtener lista de responsables (Catálogo)
    async getResponsablesCatalog() {
        try {
            const list = await Responsable.findAll({ order: [['nombre', 'ASC']] });
            return list;
        } catch (error) {
            console.error('Error al obtener catálogo de responsables:', error);
            throw error;
        }
    },

    async deleteResponsable(id) {
        try {
            const resp = await Responsable.findByPk(id);
            if (!resp) throw new Error('Responsable no encontrado');
            await resp.destroy();
            return { message: "Responsable eliminado" };
        } catch (error) {
            console.error('Error al eliminar responsable:', error);
            throw error;
        }
    }
};

module.exports = egressService;