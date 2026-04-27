import recaudacionFinalService from '../services/recaudacionFinalService.js';
import cierreCajaService from '../services/cierreCajaService.js';

const recaudacionFinalController = {

    /**
     * POST /api/recaudacion: Crea un nuevo registro.
     */
    async createRecaudacion(req, res) {
        try {
            const data = req.body;
            console.log("📥 [createRecaudacion] Recibiendo payload:", JSON.stringify(data, null, 2));

            const nuevaRecaudacion = await recaudacionFinalService.createRecaudacion(data);

            res.status(201).json({
                message: 'Recaudación final creada con éxito',
                data: nuevaRecaudacion
            });

        } catch (error) {
            console.error("❌ [createRecaudacion] Error:", error);
            console.error("❌ [createRecaudacion] Mensaje:", error.message);

            // Log Sequelize Validation Errors specifically
            if (error.errors) {
                error.errors.forEach((e, i) => {
                    console.error(`   - Error ${i + 1}: ${e.message} (Field: ${e.path}, Value: ${e.value})`);
                });
            }

            res.status(400).json({
                message: 'Error al crear el registro de recaudación. Verifique los datos.',
                error: error.message,
                details: error.errors ? error.errors.map(e => ({ message: e.message, field: e.path, value: e.value })) : null
            });
        }
    },

    /**
     * GET /api/recaudacion/:id: Obtiene un registro por ID.
     */
    async getRecaudacionById(req, res) {
        try {
            const id = req.params.id;
            const recaudacion = await recaudacionFinalService.getRecaudacionById(id);

            res.status(200).json(recaudacion);

        } catch (error) {
            console.error("Error en getRecaudacionById:", error.message);
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Error interno al obtener el registro.' });
        }
    },

    /**
     * PUT /api/recaudacion/:id: Edita un registro existente.
     */
    async updateRecaudacion(req, res) {
        try {
            const id = req.params.id;
            const updates = req.body;
            const recaudacionActualizada = await recaudacionFinalService.updateRecaudacion(id, updates);

            res.status(200).json({
                message: 'Recaudación final actualizada con éxito',
                data: recaudacionActualizada
            });

        } catch (error) {
            console.error("Error en updateRecaudacion:", error.message);
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({
                message: 'Error al actualizar el registro de recaudación. Verifique los datos.',
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/recaudacion/:id: Elimina un registro (soft delete).
     */
    async deleteRecaudacion(req, res) {
        try {
            const id = req.params.id;
            await recaudacionFinalService.deleteRecaudacion(id);

            // 204 No Content
            res.status(204).send();
            console.log(`Registro de recaudación ID ${id} eliminado (soft delete).`);

        } catch (error) {
            console.error("Error en deleteRecaudacion:", error.message);
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Error interno al intentar eliminar el registro.' });
        }
    },

    /**
     * GET /api/recaudacion: Obtiene todos los registros.
     */
    async getAllRecaudaciones(req, res) {
        try {
            const recaudaciones = await recaudacionFinalService.getAllRecaudaciones();
            res.status(200).json(recaudaciones);
        } catch (error) {
            console.error("Error en getAllRecaudaciones:", error.message);
            res.status(500).json({ message: 'Error interno al obtener los registros de recaudación.' });
        }
    },

    /**
     * POST /api/recaudacion/check-pending: Dispara el cierre automático de fechas pasadas.
     */
    async checkPendingClosures(req, res) {
        try {
            const { forceToday } = req.body;
            const result = await cierreCajaService.ejecutarCierreAutomatico({ forceToday: forceToday === true });
            res.status(200).json({
                message: 'Verificación de cierres pendientes completada',
                data: result
            });
        } catch (error) {
            console.error("Error en checkPendingClosures:", error.message);
            res.status(500).json({ message: 'Error al procesar cierres automáticos.', error: error.message });
        }
    }
};

export default recaudacionFinalController;