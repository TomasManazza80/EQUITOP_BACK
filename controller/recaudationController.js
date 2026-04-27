const { createRecaudation, deleteRecaudation, getRecaudations } = require("../services/recaudationService");

const createRecaudationController = async (req, res) => {
  try {
    const recaudation = req.body;
    const newRecaudation = await createRecaudation(recaudation);
    res.status(201).json(newRecaudation);
  } catch (error) {
    console.error("Error al crear recaudation:", error);
    res.status(400).json({
      message: "Error al crear recaudation",
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : null
    });
  }
};

const deleteRecaudationController = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deleteRecaudation(id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al eliminar recaudation:", error);
    res.status(500).json({ message: "Error al eliminar recaudation" });
  }
};

const getRecaudationsController = async (req, res) => {
  try {
    const recaudations = await getRecaudations();
    res.status(200).json(recaudations);
  } catch (error) {
    console.error("Error al obtener recaudations:", error);
    res.status(500).json({ message: "Error al obtener recaudations" });
  }
};

module.exports = { createRecaudationController, deleteRecaudationController, getRecaudationsController };