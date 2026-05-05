const express = require("express");
const SegmentoController = require("../controllers/segmentoController");

const router = express.Router();

router.get("/", SegmentoController.getAll);
router.get("/:id", SegmentoController.getById);
router.post("/", SegmentoController.create);
router.put("/:id", SegmentoController.update);
router.delete("/:id", SegmentoController.remove);

module.exports = router;
