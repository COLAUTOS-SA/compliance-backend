const ContraparteModel = require("../models/contraparteModel");

const ContraparteController = {
  async getAll(req, res) {
    try {
      const data = await ContraparteModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll contraparte error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener contrapartes" });
    }
  },

  async getById(req, res) {
    try {
      const data = await ContraparteModel.getById(req.params.id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Contraparte no encontrada" });
      res.json({ success: true, data });
    } catch (err) {
      console.error("getById contraparte error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener contraparte" });
    }
  },

  // async create(req, res) {
  //   try {
  //     const id = await ContraparteModel.create(req.body);
  //     const data = await ContraparteModel.getById(id);
  //     res.status(201).json({ success: true, data });
  //   } catch (err) {
  //     console.error("create contraparte error:", err);
  //     res
  //       .status(500)
  //       .json({ success: false, message: "Error al crear contraparte" });
  //   }
  // },

  async create(req, res) {
    try {
      const { Correo } = req.body;

      // 🔍 1. Buscar si ya existe
      const existente = await ContraparteModel.findByEmail(Correo);

      if (existente) {
        return res.json({
          success: true,
          data: existente,
          message: "Contraparte ya existente",
        });
      }

      // 🆕 2. Crear si no existe
      const id = await ContraparteModel.create(req.body);
      const data = await ContraparteModel.getById(id);

      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error("create contraparte error:", err);
      res.status(500).json({
        success: false,
        message: "Error al crear contraparte",
      });
    }
  },

  async update(req, res) {
    try {
      const data = await ContraparteModel.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      console.error("update contraparte error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar contraparte" });
    }
  },

  async remove(req, res) {
    try {
      await ContraparteModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete contraparte error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar contraparte" });
    }
  },
};

module.exports = ContraparteController;
