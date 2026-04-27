const { model } = require("../models/index");
const Recaudation = model.Recaudation;

const createRecaudation = async (recaudation) => {
  try {
    const newRecaudation = await Recaudation.create(recaudation);
    return newRecaudation;
  } catch (error) {
    console.error("Error al crear recaudation:", error);
    throw error;
  }
};

const deleteRecaudation = async (id) => {
  try {
    await Recaudation.destroy({ where: { id } });
    return { message: "Recaudation eliminada con éxito" };
  } catch (error) {
    console.error("Error al eliminar recaudation:", error);
    throw error;
  }
};

const getRecaudations = async () => {
  try {
    const recaudations = await Recaudation.findAll();
    return recaudations;
  } catch (error) {
    console.error("Error al obtener recaudations:", error);
    throw error;
  }
};

module.exports = { createRecaudation, deleteRecaudation, getRecaudations };