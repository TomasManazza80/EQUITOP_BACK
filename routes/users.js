var express = require("express");
var router = express.Router();
const { createUser, loginUser, getRole, updateUser, getAllUsers, googleLogin, updateRole } = require("../controller/userController");

router.post("/createuser", createUser);
router.get("/getAllUsers", getAllUsers);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.get('/role/:email', getRole);
router.put("/updateuser/:id", updateUser);
router.put("/update-role/:id", updateRole);


module.exports = router;
