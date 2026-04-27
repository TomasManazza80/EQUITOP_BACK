const { SuccessCase } = require("../../models/index.js");

const successCaseService = {
    async create(data) {
        try {
            return await SuccessCase.create(data);
        } catch (error) {
            throw new Error("Error creando caso de éxito: " + error.message);
        }
    },

    async getAll() {
        return await SuccessCase.findAll({
            order: [['createdAt', 'DESC']]
        });
    },

    async delete(id) {
        const item = await SuccessCase.findByPk(id);
        if (!item) throw new Error("Caso no encontrado");
        return await item.destroy();
    }
};

module.exports = successCaseService;