import { Client } from '../models/index.js';

const clienteController = {

    // POST /api/clientes
    async createClient(req, res) {
        try {
            const { nombre, telefono, dni, direccion } = req.body;
            console.log("Registrando nuevo cliente:", nombre);

            const newClient = await Client.create({ nombre, telefono, dni, direccion });

            res.status(201).json(newClient);
        } catch (error) {
            console.error("Error en createClient:", error);
            res.status(500).json({ message: "Error al registrar el cliente", error: error.message });
        }
    },

    // GET /api/clientes
    async getClients(req, res) {
        try {
            const clients = await Client.findAll({ order: [['createdAt', 'DESC']] });
            res.status(200).json(clients);
        } catch (error) {
            console.error("Error en getClients:", error);
            res.status(500).json({ message: "Error al obtener la lista de clientes", error: error.message });
        }
    }
};

export default clienteController;