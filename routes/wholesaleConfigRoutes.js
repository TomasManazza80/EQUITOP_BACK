const express = require('express');
const router = express.Router();
const WholesaleConfig = require('../models/config/wholesaleConfig');

// Obtener configuración (crea una por defecto si no existe)
router.get('/', async (req, res) => {
    try {
        let config = await WholesaleConfig.findOne();
        if (!config) {
            config = await WholesaleConfig.create({
                cartTotalMin: 100000,
                productQtyMin: 5
            });
        }
        res.json(config);
    } catch (error) {
        console.error("Error al obtener configuración mayorista:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Actualizar configuración
router.put('/', async (req, res) => {
    const { cartTotalMin, productQtyMin } = req.body;
    try {
        let config = await WholesaleConfig.findOne();
        if (!config) {
            config = await WholesaleConfig.create({ cartTotalMin, productQtyMin });
        } else {
            await config.update({ cartTotalMin, productQtyMin });
        }
        res.json({ message: "Configuración actualizada correctamente", config });
    } catch (error) {
        console.error("Error al actualizar configuración mayorista:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
