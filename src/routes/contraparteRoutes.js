const express = require("express");
const ContraparteController = require("../controllers/contraparteController");

const router = express.Router();

router.get("/", ContraparteController.getAll);
router.get("/:id", ContraparteController.getById);
router.post("/", ContraparteController.create);
router.put("/:id", ContraparteController.update);
router.delete("/:id", ContraparteController.remove);

module.exports = router;
