const express = require("express");
const TipoContraparteController = require("../controllers/tipoContraparteController");

const router = express.Router();

router.get("/", TipoContraparteController.getAll);
router.get("/:id", TipoContraparteController.getById);
router.post("/", TipoContraparteController.create);
router.put("/:id", TipoContraparteController.update);
router.delete("/:id", TipoContraparteController.remove);

module.exports = router;
