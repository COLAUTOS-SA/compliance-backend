const express = require("express");
const EstadoArchivoController = require("../controllers/estadoArchivoController");

const router = express.Router();

router.get("/", EstadoArchivoController.getAll);

module.exports = router;
