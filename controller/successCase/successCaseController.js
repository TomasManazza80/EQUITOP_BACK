import successCaseService from '../../services/successCase/successCaseService.js';

const successCaseController = {
    async create(req, res) {
        try {
            const result = await successCaseService.create(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const results = await successCaseService.getAll();
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    async delete(req, res) {
        try {
            await successCaseService.delete(req.params.id);
            res.status(200).json({ message: "Eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default successCaseController;