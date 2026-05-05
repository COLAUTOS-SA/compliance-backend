const express = require("express");
const SolicitudController = require("../controllers/solicitudController");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", SolicitudController.getAll);
router.get("/:id", SolicitudController.getById);
router.post("/", SolicitudController.create);
router.put("/:id/estado", SolicitudController.updateEstado);
router.put(
  "/:id/archivo-respuesta",
  upload.single("archivo_respuesta"),
  SolicitudController.uploadArchivoRespuesta,
);
router.put("/:id", SolicitudController.update);
router.delete("/:id", SolicitudController.remove);

module.exports = router;
