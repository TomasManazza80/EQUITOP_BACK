const crypto = require("crypto");
const { where } = require("sequelize");
const { model, Sequelize } = require("../models/index");
const { authHash, createToken, compareHash, DUMMY_HASH } = require("./auth/auth");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload;
    const cleanEmail = String(email || '').trim().toLowerCase();

    let user = await model.user.findOne({ where: { email: cleanEmail } });

    if (!user) {
      // Crear usuario con rol 'user' estrictamente y contraseña aleatoria criptográfica
      const randomSecret = crypto.randomBytes(32).toString('hex');
      user = await model.user.create({
        name: (name || "Google User").slice(0, 100),
        email: cleanEmail,
        number: "00000000",
        password: await authHash(randomSecret),
        role: 'user'
      });
    }

    const tokenPayload = {
      email: user.email,
      id: user.id,
      role: user.role,
      name: user.name
    };
    const internalToken = await createToken(tokenPayload);
    return { token: internalToken, email: user.email, role: user.role, name: user.name };
  } catch (error) {
    console.error("Error in googleLogin service:", error.message);
    throw error;
  }
};

const login = async (value) => {
  try {
    const cleanEmail = String(value.email || '').trim().toLowerCase();
    const user = await model.user.findOne({
      where: {
        email: cleanEmail,
      },
    });

    if (!user) {
      // Prevención de ataques de temporización (timing attacks):
      // Ejecutamos compareHash contra DUMMY_HASH para que el tiempo de respuesta sea idéntico
      await compareHash(value.password, DUMMY_HASH).catch(() => false);
      return null;
    }

    const isValidPassword = await compareHash(value.password, user.password);
    if (!isValidPassword) {
      return null;
    }

    const tokenPayload = {
      email: user.email,
      id: user.id,
      role: user.role,
      name: user.name
    };
    const token = await createToken(tokenPayload);
    return { token, email: user.email, role: user.role, name: user.name };
  } catch (error) {
    console.error("Error in login service:", error.message);
    throw error;
  }
};

const createUser = async (data) => {
  try {
    const cleanEmail = String(data.email || '').trim().toLowerCase();
    
    // Verificar si el correo ya existe para evitar errores no controlados de base de datos
    const existing = await model.user.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return { duplicate: true };
    }

    const EncyPass = await authHash(data.password);
    const userData = {
      name: String(data.name || '').trim().slice(0, 100),
      number: String(data.number || '').trim().slice(0, 30),
      email: cleanEmail,
      password: EncyPass,
      role: 'user' // Hardcoded: Previene asignación masiva de roles privilegiados
    };

    const FinalData = await model.user.create(userData);
    return {
      id: FinalData.id,
      name: FinalData.name,
      email: FinalData.email,
      role: FinalData.role
    };
  } catch (error) {
    console.error("Error in createUser service:", error.message);
    throw error;
  }
};

const updateUser = async (data) => {
  try {
    const user = await model.user.findOne({
      where: {
        id: data.id,
      },
    });

    if (!user) {
      return null;
    }

    const updatedData = {
      name: data.name ? String(data.name).trim().slice(0, 100) : user.name,
      number: data.number ? String(data.number).trim().slice(0, 30) : user.number,
      email: data.email ? String(data.email).trim().toLowerCase().slice(0, 150) : user.email,
    };

    if (data.password && typeof data.password === 'string' && data.password.trim().length >= 8) {
      updatedData.password = await authHash(data.password);
    }

    if (data.role) {
      updatedData.role = data.role;
    }

    await user.update(updatedData);
    return {
      id: user.id,
      name: updatedData.name,
      number: updatedData.number,
      email: updatedData.email,
      role: updatedData.role || user.role,
    };
  } catch (error) {
    console.error("Error in updateUser service:", error.message);
    throw error;
  }
};

const deleteUser = async (id) => {
  try {
    const user = await model.user.destroy({
      where: {
        id,
      },
    });
    if (!user) {
      return null;
    } else {
      return "User deleted successfully";
    }
  } catch (error) {
    console.error("Error in deleteUser:", error.message);
    throw error;
  }
};

const getRoleByEmail = async (email) => {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = await model.user.findOne({
      where: {
        email: cleanEmail,
      },
      attributes: ['role'],
    });
    if (!user) {
      return null;
    } else {
      return user.role;
    }
  } catch (error) {
    console.error("Error in getRoleByEmail:", error.message);
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const users = await model.user.findAll({
      attributes: { exclude: ['password'] }
    });
    return users;
  } catch (error) {
    console.error("Error in getAllUsers service:", error.message);
    throw error;
  }
};

const updateUserRole = async (id, role) => {
  try {
    const [updatedRows] = await model.user.update(
      { role: role },
      { where: { id: id } }
    );

    if (updatedRows === 0) {
      console.log("USER NOT FOUND FOR ID:", id);
      return "NOT FOUND!";
    } else {
      console.log(`ROLE UPDATED SUCCESSFULLY FOR USER ${id} TO ${role}`);
      return { message: "Role updated successfully", role: role };
    }
  } catch (error) {
    console.log("ERROR IN updateUserRole SERVICE:", error);
    throw error;
  }
};

module.exports = { login, createUser, updateUser, deleteUser, getRoleByEmail, getAllUsers, googleLogin, updateUserRole };