const express = require("express");
const router = express.Router();
const pedidoWhatsappController = require("../controller/pedidoWhatsappController");

router.post("/crear", pedidoWhatsappController.crearPedido);
router.get("/listar", pedidoWhatsappController.obtenerPedidos);
router.put("/actualizar-estado/:id", pedidoWhatsappController.actualizarEstado);
router.put("/editar/:id", pedidoWhatsappController.editarPedido);
router.post("/cobrar/:id", pedidoWhatsappController.cobrarPedido);

module.exports = router;
