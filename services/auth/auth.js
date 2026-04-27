const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config(); // Para manejar variables de entorno

// Configuración segura
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_should_be_long_and_complex_in_env';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = '1h'; // 1 hora para tokens de acceso (usar refresh tokens para sesiones largas)

const authHash = async (password) => {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log("Contraseña hasheada:", hash);
    return hash;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

async function compareHash(userPass, dbPass) {
  try {
    if (!userPass || !dbPass) throw new Error("Both passwords are required for comparison");
    const isMatch = await bcrypt.compare(userPass, dbPass);
    return isMatch;
  } catch (err) {
    console.error("Error comparing passwords:", err);
    throw err;
  }
}

async function createToken(userData) {
  try {
    if (!userData) throw new Error("User data is required");
    if (!JWT_SECRET || JWT_SECRET === 'fallback_secret_should_be_long_and_complex_in_env') {
      console.warn("Warning: Using fallback JWT secret. This should be replaced with a proper secret in production.");
    }

    // Solo incluir datos necesarios en el token
    const payload = {
      email: userData.email,
      userId: userData.id,
      role: userData.role,
      name: userData.name
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
      algorithm: 'HS256' // Especifica el algoritmo
    });

    return token;
  } catch (err) {
    console.error("Error creating token:", err);
    throw err;
  }
}

// Función adicional recomendada para verificar tokens
async function verifyToken(token) {
  try {
    if (!token) throw new Error("Token is required");
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("Token verification failed:", err);
    throw err;
  }
}

module.exports = {
  authHash,
  createToken,
  compareHash,
  verifyToken // Exportamos la nueva función
};