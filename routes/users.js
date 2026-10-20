var express = require("express");
var router = express.Router();
const { createUser, loginUser, getRole, updateUser, getAllUsers, googleLogin, updateRole, deleteUser } = require("../controller/userController");
const { authenticateToken, requireAdmin, requireSelfOrAdmin } = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter, authAuxLimiter } = require("../middleware/rateLimiter");

// Rutas de autenticación con protección de tasa contra fuerza bruta
router.post("/login", loginLimiter, loginUser);
router.post("/createuser", registerLimiter, createUser);
router.post("/google-login", authAuxLimiter, googleLogin);

// Consulta de rol protegida
router.get('/role/:email', authAuxLimiter, authenticateToken, getRole);

// Rutas de administración protegidas contra extracción o manipulación de la base de datos
router.get("/getAllUsers", authenticateToken, requireAdmin, getAllUsers);
router.put("/update-role/:id", authenticateToken, requireAdmin, updateRole);
router.delete("/delete-user/:id", authenticateToken, requireAdmin, deleteUser);
router.put("/updateuser/:id", authenticateToken, requireSelfOrAdmin, updateUser);

module.exports = router;
