const { verifyToken } = require('../services/auth/auth');

/**
 * Middleware para autenticar requests mediante JWT en Bearer header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Acceso no autorizado: Token no proporcionado' });
    }

    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Sesión expirada o token inválido' });
  }
};

/**
 * Middleware para autorizar únicamente a administradores
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de Administrador' });
  }
  next();
};

/**
 * Middleware para permitir que un usuario solo acceda a su propio recurso, o que sea administrador
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  const targetId = req.params.id ? String(req.params.id) : null;
  const currentUserId = req.user.userId ? String(req.user.userId) : null;
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && targetId && currentUserId !== targetId) {
    return res.status(403).json({ message: 'Acceso denegado: No posee permisos para modificar este recurso' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSelfOrAdmin
};
