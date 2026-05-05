const SolicitudModel = require("../models/solicitudModel");
const ConceptoModel = require("../models/conceptoModel");

const SolicitudController = {
  async getAll(req, res) {
    try {
      const data = await SolicitudModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener solicitudes" });
    }
  },

  async getById(req, res) {
    try {
      const solicitud = await SolicitudModel.getById(req.params.id);
      if (!solicitud) {
        return res
          .status(404)
          .json({ success: false, message: "Solicitud no encontrada" });
      }
      const conceptos = await ConceptoModel.getBySolicitud(req.params.id);
      res.json({ success: true, data: { solicitud, conceptos } });
    } catch (err) {
      console.error("getById solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener solicitud" });
    }
  },

  async create(req, res) {
    try {
      const id = await SolicitudModel.create(req.body);
      const solicitud = await SolicitudModel.getById(id);
      res.status(201).json({ success: true, data: solicitud });
    } catch (err) {
      console.error("create solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al crear solicitud" });
    }
  },

  async update(req, res) {
    try {
      const solicitud = await SolicitudModel.update(req.params.id, req.body);
      res.json({ success: true, data: solicitud });
    } catch (err) {
      console.error("update solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar solicitud" });
    }
  },

  async remove(req, res) {
    try {
      await SolicitudModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar solicitud" });
    }
  },
};

module.exports = SolicitudController;
