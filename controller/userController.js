const userService = require("../services/userServices");
const AllValidation = require("../validation/AllValidation");

const loginUser = async (req, res) => {
  try {
    const userdata = req.body;
    const { value, error } = AllValidation.fetchUser.validate(userdata);
    if (error !== undefined) {
      console.log("error", error);
      res.status(400).send(error.details[0].message);
    } else {
      const response = await userService.login(value);
      if (response === "NOT FOUND!" || response === "Password wrong!") {
        res.status(401).send(response === "NOT FOUND!" ? "Usuario no encontrado!" : "Contraseña incorrecta!");
      } else {
        res.send(response);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno del servidor");
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).send("Se requiere un token");
    }
    const response = await userService.googleLogin(token);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
};

const createUser = async (req, res) => {
  try {
    const userdata = req.body;
    const { value, error } = AllValidation.createUser.validate(userdata);
    if (error !== undefined) {
      console.log("error", error);
      return res.status(400).send(error.details[0].message);
    }

    const user = await userService.createUser(value);
    if (!user) {
      res.sendStatus(401);
    } else {
      res.sendStatus(200);
    }

  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno del servidor");
  }
};

const getRole = async (req, res) => {
  try {
    const userEmail = req.params.email;
    const response = await userService.getRoleByEmail(userEmail);
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno del servidor");
  }
};



const updateUser = async (req, res) => {
  try {
    const userdata = req.body;
    const { value, error } = AllValidation.updateUser.validate(userdata);
    if (error !== undefined) {
      console.log("error", error);
      res.status(400).send(error.details[0].message);
    } else {
      const response = await userService.updateUser({ id: req.params.id, ...value });
      if (!response) {
        res.sendStatus(404); // Usuario no encontrado
      } else {
        res.sendStatus(200); // Usuario actualizado con éxito
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno del servidor");
  }
};

const getAllUsers = async (req, res) => {
  try {
    const response = await userService.getAllUsers();
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno del servidor");
  }
};




const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await userService.deleteUser(id);
    if (response === "NOT FOUND!") {
      res.status(404).send("Usuario no encontrado");
    } else {
      res.status(200).send(response);
    }
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).send("Error interno del servidor");
  }
};

const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;
    console.log(`ATTEMPTING_UPDATE_ROLE [ID: ${id}] [ROLE: ${role}]`);

    const { value, error } = AllValidation.updateUserRole.validate({ role });

    if (error !== undefined) {
      console.log("VALIDATION_ERROR IN updateRole:", error.details[0].message);
      res.status(400).send(error.details[0].message);
    } else {
      const response = await userService.updateUserRole(id, value.role);
      if (response === "NOT FOUND!") {
        console.log(`UPDATE_ROLE_FAILED: USER ${id} NOT FOUND`);
        res.status(404).send("Usuario no encontrado");
      } else {
        console.log(`UPDATE_ROLE_SUCCESS: USER ${id} ROLE -> ${value.role}`);
        res.status(200).send(response);
      }
    }
  } catch (error) {
    console.error("CRITICAL_ERROR IN updateRole CONTROLLER:", error);
    res.status(500).send("Error interno del servidor: " + error.message);
  }
};

module.exports = { loginUser, createUser, updateUser, deleteUser, getRole, getAllUsers, googleLogin, updateRole };