const ConceptoModel = require("../models/conceptoModel");

const ConceptoController = {
  async getAll(req, res) {
    try {
      const data = await ConceptoModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll concepto error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener conceptos" });
    }
  },

  async getBySolicitud(req, res) {
    try {
      const data = await ConceptoModel.getBySolicitud(req.params.id_solicitud);
      res.json({ success: true, data });
    } catch (err) {
      console.error("getBySolicitud concepto error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al obtener conceptos de la solicitud",
        });
    }
  },

  async create(req, res) {
    try {
      const id = await ConceptoModel.create(req.body);
      const data = await ConceptoModel.getBySolicitud(req.body.id_solicitud);
      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error("create concepto error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al registrar concepto" });
    }
  },
};

module.exports = ConceptoController;
