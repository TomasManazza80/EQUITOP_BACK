const { Client } = require("../models/index.js");

const createClient = async (req, res) => {
    try {
        const { nombre, telefono, dni, direccion } = req.body;

        // Validacion basica
        if (!nombre) {
            return res.status(400).send("El nombre es requerido");
        }

        const newClient = await Client.create({
            nombre,
            telefono,
            dni,
            direccion
        });

        res.status(201).json(newClient);
    } catch (error) {
        console.error("Error creating client:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).send("El DNI ya existe en el sistema.");
        }
        res.status(500).send("Internal Server Error");
    }
};

const getAllClients = async (req, res) => {
    try {
        const clients = await Client.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(clients);
    } catch (error) {
        console.error("Error getting clients:", error);
        res.status(500).send("Internal Server Error");
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, dni, direccion } = req.body;

        const client = await Client.findByPk(id);
        if (!client) return res.status(404).send("Cliente no encontrado");

        await client.update({ nombre, telefono, dni, direccion });
        res.status(200).json(client);
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).send("Internal Server Error");
    }
}

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findByPk(id);
        if (!client) return res.status(404).send("Cliente no encontrado");

        await client.destroy();
        res.status(200).send("Cliente eliminado");
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).send("Internal Server Error");
    }
}


module.exports = { createClient, getAllClients, updateClient, deleteClient };
