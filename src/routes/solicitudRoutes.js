const express = require("express");
const SolicitudController = require("../controllers/solicitudController");

const router = express.Router();

router.get("/", SolicitudController.getAll);
router.get("/:id", SolicitudController.getById);
router.post("/", SolicitudController.create);
router.put("/:id", SolicitudController.update);
router.delete("/:id", SolicitudController.remove);

module.exports = router;
