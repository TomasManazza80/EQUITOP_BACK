const userService = require("../services/userServices");
const AllValidation = require("../validation/AllValidation");

const loginUser = async (req, res) => {
  try {
    const userdata = req.body;
    const { value, error } = AllValidation.fetchUser.validate(userdata);
    if (error !== undefined) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const response = await userService.login(value);
    if (!response) {
      // Mensaje unificado para evitar enumeración de usuarios y extracción de datos
      return res.status(401).json({ message: "Credenciales inválidas. Por favor verifique sus datos." });
    }
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in loginUser controller:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Se requiere un token válido" });
    }
    const response = await userService.googleLogin(token);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in googleLogin controller:", error.message);
    res.status(401).json({ message: "Error de autenticación con Google" });
  }
};

const createUser = async (req, res) => {
  try {
    const userdata = req.body;
    const { value, error } = AllValidation.createUser.validate(userdata);
    if (error !== undefined) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await userService.createUser(value);
    if (result && result.duplicate) {
      return res.status(409).json({ message: "El correo electrónico ya se encuentra registrado." });
    }

    if (!result) {
      return res.status(400).json({ message: "No fue posible registrar la cuenta." });
    }

    return res.status(201).json({ message: "Usuario registrado con éxito", user: result });
  } catch (error) {
    console.error("Error in createUser controller:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
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
    if (!response) {
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
    res.status(500).send("Error interno del servidor");
  }
};

module.exports = { loginUser, createUser, updateUser, deleteUser, getRole, getAllUsers, googleLogin, updateRole };