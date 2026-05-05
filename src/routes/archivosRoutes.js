const express = require("express");
const ArchivosController = require("../controllers/archivosController");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(), // 🔥 clave
});

const router = express.Router();

// ===============================
// CONSULTAS
// ===============================

// GET /api/archivos
// GET /api/archivos?solicitud=ID   👉 archivos de una solicitud (modal admin)
router.get("/", ArchivosController.getAll);

// GET /api/archivos/:id
router.get("/:id", ArchivosController.getById);

// ===============================
// CREACIÓN
// ===============================

// POST /api/archivos
// 👉 lo usa la contraparte al enviar la solicitud
router.post(
  "/",
  upload.array("archivos"), // 🔥 importante (nombre del input)
  ArchivosController.create,
);
// ===============================
// REVISIÓN OFICIAL (MUY IMPORTANTE)
// ===============================

// PUT /api/archivos/:id/revision
// 👉 la oficial de cumplimiento aprueba / rechaza + concepto
router.put("/:id/revision", ArchivosController.updateRevision);

// ===============================
// ACTUALIZACIÓN GENERAL (opcional)
// ===============================

// PUT /api/archivos/:id
router.put("/:id", ArchivosController.update);

// ===============================
// ELIMINACIÓN
// ===============================

// DELETE /api/archivos/:id
router.delete("/:id", ArchivosController.remove);

module.exports = router;
