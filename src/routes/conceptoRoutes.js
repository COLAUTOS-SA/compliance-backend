const express = require("express");
const ConceptoController = require("../controllers/conceptoController");

const router = express.Router();

router.get("/", ConceptoController.getAll);
router.get("/solicitud/:id_solicitud", ConceptoController.getBySolicitud);
router.post("/", ConceptoController.create);

module.exports = router;
