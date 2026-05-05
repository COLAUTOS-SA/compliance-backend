const express = require("express");
const AccionistasController = require("../controllers/accionistasController");

const router = express.Router();

router.get(
  "/contraparte/:id_contraparte",
  AccionistasController.getByContraparte
);
router.post("/", AccionistasController.create);
router.delete("/:id", AccionistasController.remove);

module.exports = router;
