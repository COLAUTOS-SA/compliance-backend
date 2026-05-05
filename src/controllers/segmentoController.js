const SegmentoModel = require("../models/segmentoModel");

const SegmentoController = {
  async getAll(req, res) {
    try {
      const data = await SegmentoModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll segmento error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener segmentos" });
    }
  },

  async getById(req, res) {
    try {
      const data = await SegmentoModel.getById(req.params.id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Segmento no encontrado" });
      }
      res.json({ success: true, data });
    } catch (err) {
      console.error("getById segmento error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener segmento" });
    }
  },

  async create(req, res) {
    try {
      const { Nombre, id_tipo_contraparte } = req.body;
      const id = await SegmentoModel.create({ Nombre, id_tipo_contraparte });
      const data = await SegmentoModel.getById(id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error("create segmento error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al crear segmento" });
    }
  },

  async update(req, res) {
    try {
      const { Nombre, id_tipo_contraparte } = req.body;
      const data = await SegmentoModel.update(req.params.id, {
        Nombre,
        id_tipo_contraparte,
      });
      res.json({ success: true, data });
    } catch (err) {
      console.error("update segmento error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar segmento" });
    }
  },

  async remove(req, res) {
    try {
      await SegmentoModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete segmento error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar segmento" });
    }
  },
};

module.exports = SegmentoController;
