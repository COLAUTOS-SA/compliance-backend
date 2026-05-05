const AccionistasModel = require("../models/accionistasModel");

const AccionistasController = {
  async getByContraparte(req, res) {
    try {
      const data = await AccionistasModel.getByContraparte(
        req.params.id_contraparte
      );
      res.json({ success: true, data });
    } catch (err) {
      console.error("get accionistas error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener accionistas" });
    }
  },

  async create(req, res) {
    try {
      const id = await AccionistasModel.create(req.body);
      const data = await AccionistasModel.getByContraparte(
        req.body.id_contraparte
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error("create accionista error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al crear accionista" });
    }
  },

  async remove(req, res) {
    try {
      await AccionistasModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete accionista error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar accionista" });
    }
  },
};

module.exports = AccionistasController;
