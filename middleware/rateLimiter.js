const { rateLimit } = require('express-rate-limit');

/**
 * Rate Limiter estricto para el inicio de sesión.
 * Mitiga ataques de fuerza bruta, extracción de contraseñas y credential stuffing.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos por IP cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos de acceso fallidos. Por seguridad, intente nuevamente en 15 minutos."
  }
});

/**
 * Rate Limiter para la creación de usuarios (registro).
 * Mitiga ataques de inundación de base de datos, bots de spam y enumeración masiva.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Máximo 10 registros por IP por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiadas solicitudes de registro desde esta conexión. Por favor intente más tarde."
  }
});

/**
 * Rate Limiter para endpoints de autenticación auxiliares (ej. Google Login, consultas de rol).
 */
const authAuxLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Límite de solicitudes de autenticación excedido. Por favor espere unos momentos."
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  authAuxLimiter
};
