import RecaudacionFinal from '../models/recaudacionFinal/recaudacionFinal.js'; 

const recaudacionFinalService = {

    /**
     * Crea un nuevo registro de RecaudacionFinal.
     * @param {Object} data - Datos para la nueva recaudación.
     */
    async createRecaudacion(data) {
        console.log("Creando nuevo registro de recaudación final...");
        try {
            const nuevaRecaudacion = await RecaudacionFinal.create(data);
            return nuevaRecaudacion;
        } catch (error) {
            console.error('Error al crear la recaudación:', error);
            throw error;
        }
    },

    /**
     * Obtiene una recaudación por su ID.
     * @param {number} id - ID del registro.
     */
    async getRecaudacionById(id) {
        try {
            const recaudacion = await RecaudacionFinal.findByPk(id);
            if (!recaudacion) {
                throw new Error('Registro de recaudación no encontrado');
            }
            return recaudacion;
        } catch (error) {
            console.error(`Error al obtener recaudación con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Actualiza un registro existente de RecaudacionFinal.
     * @param {number} id - ID del registro a editar.
     * @param {Object} updates - Objeto con los campos a actualizar.
     */
    async updateRecaudacion(id, updates) {
        try {
            const recaudacion = await RecaudacionFinal.findByPk(id);
            
            if (!recaudacion) {
                throw new Error('Registro de recaudación no encontrado');
            }

            await recaudacion.update(updates);
            
            return recaudacion;

        } catch (error) {
            console.error(`Error al actualizar recaudación con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Elimina (soft delete) un registro de RecaudacionFinal.
     * @param {number} id - ID del registro a eliminar.
     */
    async deleteRecaudacion(id) {
        try {
            const recaudacion = await RecaudacionFinal.findByPk(id);

            if (!recaudacion) {
                throw new Error('Registro de recaudación no encontrado');
            }

            await recaudacion.destroy();
            
            return { message: 'Registro eliminado exitosamente' };

        } catch (error) {
            console.error(`Error al eliminar recaudación con ID ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Obtiene todos los registros.
     */
    async getAllRecaudaciones() {
        try {
            const recaudaciones = await RecaudacionFinal.findAll();
            return recaudaciones;
        } catch (error) {
            console.error('Error al obtener todas las recaudaciones:', error);
            throw error;
        }
    },
};

export default recaudacionFinalService;