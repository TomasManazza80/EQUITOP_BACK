const Provider = require("../models/providers/provider");

const createProvider = async (req, res) => {
    try {
        const { nombre, telefono, dni, direccion } = req.body;

        // Validacion basica
        if (!nombre) {
            return res.status(400).send("El nombre es requerido");
        }

        const newProvider = await Provider.create({
            nombre,
            telefono,
            dni,
            direccion
        });

        res.status(200).json(newProvider);
    } catch (error) {
        console.error("Error creating provider:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).send("El DNI/Identificación ya existe en el sistema.");
        }
        res.status(500).send("Internal Server Error");
    }
};

const getAllProviders = async (req, res) => {
    try {
        const providers = await Provider.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(providers);
    } catch (error) {
        console.error("Error getting providers:", error);
        res.status(500).send("Internal Server Error");
    }
};

const updateProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, dni, direccion } = req.body;

        const provider = await Provider.findByPk(id);
        if (!provider) return res.status(404).send("Proveedor no encontrado");

        await provider.update({ nombre, telefono, dni, direccion });
        res.status(200).json(provider);
    } catch (error) {
        console.error("Error updating provider:", error);
        res.status(500).send("Internal Server Error");
    }
}

const deleteProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const provider = await Provider.findByPk(id);
        if (!provider) return res.status(404).send("Proveedor no encontrado");

        await provider.destroy();
        res.status(200).send("Proveedor eliminado");
    } catch (error) {
        console.error("Error deleting provider:", error);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = { createProvider, getAllProviders, updateProvider, deleteProvider };
