const Provider = require("../models/providers/provider");
const Product = require("../models/products/product");

const createProvider = async (req, res) => {
    try {
        const { nombre, telefono, dni, direccion } = req.body;

        // Validacion basica
        if (!nombre) {
            return res.status(400).send("El nombre es requerido");
        }

        const formattedNombre = nombre.trim().toUpperCase();

        const newProvider = await Provider.create({
            nombre: formattedNombre,
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
            order: [['nombre', 'ASC']]
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

        const oldNombre = provider.nombre;
        const formattedNombre = nombre ? nombre.trim().toUpperCase() : oldNombre;

        await provider.update({ nombre: formattedNombre, telefono, dni, direccion });

        if (Product && oldNombre && formattedNombre && oldNombre !== formattedNombre) {
            await Product.update(
                { proveedor: formattedNombre },
                { where: { proveedor: oldNombre } }
            );
        }

        res.status(200).json(provider);
    } catch (error) {
        console.error("Error updating provider:", error);
        res.status(500).send("Internal Server Error");
    }
};

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
