const ShippingRate = require('../models/gastos/ShippingRate');
const BankRate = require('../models/gastos/BankRate');
const GlobalConfig = require('../models/gastos/GlobalConfig');
const Product = require('../models/products/product');
const { Op } = require('sequelize');

const gastosController = {
    // --- SHIPPING RATES ---
    getShippingRates: async (req, res) => {
        try {
            const rates = await ShippingRate.findAll();
            res.json(rates);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateShippingRate: async (req, res) => {
        try {
            const { zona, costo } = req.body;
            // Upsert: Create if not exists, update if exists
            // Assuming we identify by 'zona'
            let rate = await ShippingRate.findOne({ where: { zona } });
            if (rate) {
                rate.costo = costo;
                await rate.save();
            } else {
                rate = await ShippingRate.create({ zona, costo });
            }
            res.json(rate);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // --- BANK RATES ---
    getBankRates: async (req, res) => {
        try {
            const rates = await BankRate.findAll();
            res.json(rates);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createBankRate: async (req, res) => {
        try {
            const { banco, cuotas, porcentajeInteres } = req.body;
            const newRate = await BankRate.create({ banco, cuotas, porcentajeInteres });
            res.json(newRate);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteBankRate: async (req, res) => {
        try {
            const { id } = req.params;
            await BankRate.destroy({ where: { id } });
            res.json({ message: 'Bank rate deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // --- PRICE UPDATES ---
    updatePrices: async (req, res) => {
        try {
            // El frontend ahora envía un array de IDs y la instrucción de redondeo.
            const { productIds, targetPrice, increaseType, value, roundTo } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({ error: 'No se proporcionaron IDs de productos para actualizar.' });
            }

            // La cláusula de búsqueda ahora se basa en la lista de IDs.
            const whereClause = {
                id: { [Op.in]: productIds }
            };

            // Mapear el precio objetivo a la clave de precio de la variante.
            let variantPriceKey = '';
            switch (targetPrice) {
                case 'public': variantPriceKey = 'precioAlPublico'; break;
                case 'reseller': variantPriceKey = 'precioRevendedor'; break;
                case 'wholesale': variantPriceKey = 'precioMayorista'; break;
                default: return res.status(400).json({ error: 'Invalid target price' });
            }

            const products = await Product.findAll({ where: whereClause });
            let updatedCount = 0;

            for (const p of products) {
                let variants = p.variantes || [];
                if (typeof variants === 'string') {
                    try { variants = JSON.parse(variants); } catch (e) { variants = []; }
                }

                if (variantPriceKey && Array.isArray(variants) && variants.length > 0) {
                    const updatedVariants = variants.map(v => {
                        let currentVPrice = parseFloat(v[variantPriceKey] || 0);

                        // Aplicar aumento
                        if (increaseType === 'percentage') {
                            currentVPrice = currentVPrice * (1 + (value / 100));
                        } else if (increaseType === 'fixed') {
                            currentVPrice = currentVPrice + parseFloat(value);
                        }

                        // Aplicar redondeo si se especifica
                        if (roundTo && roundTo > 0) {
                            currentVPrice = Math.ceil(currentVPrice / roundTo) * roundTo;
                        }

                        return { ...v, [variantPriceKey]: currentVPrice };
                    });
                    p.variantes = updatedVariants;
                    p.changed('variantes', true); // Marcar el campo JSON como modificado
                }

                p.fechaActualizacionPrecio = new Date();
                await p.save();
                updatedCount++;
            }

            res.json({ message: `SINC_EXITOSA: ${updatedCount} PRODUCTOS ACTUALIZADOS`, count: updatedCount });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: `Error al actualizar precios: ${error.message}` });
        }
    },

    previewProducts: async (req, res) => {
        try {
            const { scope, searchQuery, searchField } = req.body;

            let whereClause = {};
            if (scope === 'search' && searchQuery) {
                if (searchField === 'nombre') {
                    whereClause = { nombre: { [Op.iLike]: `%${searchQuery}%` } };
                } else if (searchField === 'categoria') {
                    whereClause = { categoria: { [Op.iLike]: `%${searchQuery}%` } };
                } else {
                    whereClause = {
                        [Op.or]: [
                            { nombre: { [Op.iLike]: `%${searchQuery}%` } },
                            { marca: { [Op.iLike]: `%${searchQuery}%` } },
                            { categoria: { [Op.iLike]: `%${searchQuery}%` } }
                        ]
                    };
                }
            } else if (scope === 'all') {
                whereClause = {};
            } else {
                return res.json([]);
            }

            const products = await Product.findAll({
                where: whereClause,
                limit: 50,
                attributes: ['id', 'nombre', 'marca', 'categoria', 'precioVenta', 'variantes', 'updatedAt']
            });

            res.json(products);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },


    // --- GLOBAL CONFIGS (Ecommerce fees, etc.) ---
    getGlobalConfigs: async (req, res) => {
        try {
            console.log("GET_GLOBAL_CONFIGS: Request Received");
            // Ensure model is synced (redundant but safe)
            await GlobalConfig.sync();
            const configs = await GlobalConfig.findAll();
            console.log(`GET_GLOBAL_CONFIGS: Found ${configs.length} items`);
            res.json(configs);
        } catch (error) {
            console.error("GET_GLOBAL_CONFIGS_ERROR:", error);
            res.status(500).json({ error: error.message });
        }
    },

    updateGlobalConfigs: async (req, res) => {
        try {
            const { configs } = req.body; // Expecting [{key, value, description}]
            console.log("UPDATE_GLOBAL_CONFIGS: Received payload", configs);

            await GlobalConfig.sync(); // Ensure table exists

            for (const item of configs) {
                const [config, created] = await GlobalConfig.findOrCreate({
                    where: { key: item.key },
                    defaults: { value: item.value.toString(), description: item.description }
                });
                if (!created) {
                    config.value = item.value.toString();
                    if (item.description) config.description = item.description;
                    await config.save();
                }
            }
            console.log("UPDATE_GLOBAL_CONFIGS: Operation success");
            res.json({ message: 'Configs updated successfully' });
        } catch (error) {
            console.error("UPDATE_GLOBAL_CONFIGS_ERROR:", error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = gastosController;
