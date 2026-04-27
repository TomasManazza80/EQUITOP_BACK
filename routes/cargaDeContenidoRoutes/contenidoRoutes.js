var express = require('express');
var router = express.Router();
var cmsVisualController = require('../../controller/cargaDeContenido/contenidoController');

// --- ENDPOINTS CMS VISUAL FEDECELL ---
router.post('/crearContenidoVisual', cmsVisualController.createEntry);
router.get('/obtenerContenidoVisual', cmsVisualController.getAllEntries);
router.put('/actualizarContenidoVisual/:id', cmsVisualController.updateEntry);
router.delete('/eliminarContenidoVisual/:id', cmsVisualController.deleteEntry);

module.exports = router;